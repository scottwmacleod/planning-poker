import { routePartykitRequest, Server, type Connection } from 'partyserver'
import type { ClientMessage, Participant, RoomState, ServerMessage } from '../lib/types'

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
    const data: ClientMessage = JSON.parse(message)

    switch (data.type) {
      case 'join': {
        this.state.participants[sender.id] = {
          id: sender.id,
          name: data.name,
          isSpectator: data.isSpectator,
          vote: null,
        }
        if (Object.keys(this.state.participants).length === 1) {
          this.state.deck = data.deck
        }
        break
      }
      case 'rename': {
        const p = this.getSelf(sender)
        const name = data.name.trim()
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
