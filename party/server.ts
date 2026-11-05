import { routePartykitRequest, Server, type Connection } from 'partyserver'
import { DECKS, type ClientMessage, type Deck, type Participant, type RoomState, type ServerMessage } from '../lib/types'

const MAX_NAME_LENGTH = 24

const isDeck = (v: unknown): v is Deck => typeof v === 'string' && Object.hasOwn(DECKS, v)

// Trimmed and capped, or null if nothing is left.
function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return v.trim().slice(0, MAX_NAME_LENGTH) || null
}

// Returns a well-formed message, or null for anything the protocol doesn't allow.
function parseClientMessage(raw: string): ClientMessage | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const msg = data as Record<string, unknown>

  switch (msg.type) {
    case 'join': {
      const name = cleanName(msg.name)
      if (!name || typeof msg.isSpectator !== 'boolean') return null
      return { type: 'join', name, isSpectator: msg.isSpectator }
    }
    case 'rename': {
      if (typeof msg.name !== 'string') return null
      return { type: 'rename', name: msg.name }
    }
    case 'vote':
      return typeof msg.value === 'string' ? { type: 'vote', value: msg.value } : null
    case 'setSpectator':
      return typeof msg.isSpectator === 'boolean' ? { type: 'setSpectator', isSpectator: msg.isSpectator } : null
    case 'changeDeck':
      return isDeck(msg.deck) ? { type: 'changeDeck', deck: msg.deck } : null
    case 'reveal':
    case 'newRound':
      return { type: msg.type }
    default:
      return null
  }
}

export class PokerRoom extends Server {
  state: RoomState = {
    participants: {},
    phase: 'voting',
    deck: 'fibonacci',
  }

  onConnect(conn: Connection) {
    conn.send(this.stateMessage())
  }

  onClose(conn: Connection) {
    delete this.state.participants[conn.id]
    this.checkAutoReveal()
    this.broadcastState()
  }

  onMessage(sender: Connection, message: string) {
    const data = parseClientMessage(message)
    if (!data) return

    switch (data.type) {
      case 'join': {
        this.state.participants[sender.id] = {
          id: sender.id,
          name: data.name,
          isSpectator: data.isSpectator,
          vote: null,
        }
        break
      }
      case 'rename': {
        const p = this.getSelf(sender)
        const name = cleanName(data.name)
        if (p && name) {
          p.name = name
        }
        break
      }
      case 'setSpectator': {
        const p = this.getSelf(sender)
        if (p) {
          p.isSpectator = data.isSpectator
          if (p.isSpectator) {
            p.vote = null
            this.checkAutoReveal()
          }
        }
        break
      }
      case 'vote': {
        if (!DECKS[this.state.deck].map(String).includes(data.value)) return
        const p = this.getSelf(sender)
        if (p && !p.isSpectator && this.state.phase === 'voting') {
          p.vote = data.value
          this.checkAutoReveal()
        }
        break
      }
      case 'reveal': {
        this.state.phase = 'revealed'
        break
      }
      case 'newRound': {
        this.state.phase = 'voting'
        for (const p of Object.values(this.state.participants)) {
          p.vote = null
        }
        break
      }
      case 'changeDeck': {
        this.state.deck = data.deck
        this.state.phase = 'voting'
        for (const p of Object.values(this.state.participants)) {
          p.vote = null
        }
        break
      }
    }

    this.broadcastState()
  }

  private getSelf(conn: Connection): Participant | undefined {
    return this.state.participants[conn.id]
  }

  private checkAutoReveal() {
    if (this.state.phase === 'revealed') return
    const players = Object.values(this.state.participants).filter(p => !p.isSpectator)
    if (players.length > 0 && players.every(p => p.vote !== null)) {
      this.state.phase = 'revealed'
    }
  }

  private stateMessage() {
    const msg: ServerMessage = { type: 'state', ...this.state }
    return JSON.stringify(msg)
  }

  private broadcastState() {
    this.broadcast(this.stateMessage())
  }
}

// Routes /parties/main/:room to the PokerRoom Durable Object bound as `Main`.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ?? new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
