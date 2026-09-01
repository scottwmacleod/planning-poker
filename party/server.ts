import type * as Party from 'partykit/server'
import type { ClientMessage, Deck, Participant, RoomState, ServerMessage } from '../lib/types'

export default class PokerRoom implements Party.Server {
  state: RoomState = {
    participants: {},
    phase: 'voting',
    deck: 'fibonacci',
  }

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const msg: ServerMessage = { type: 'state', ...this.state }
    conn.send(JSON.stringify(msg))
  }

  onClose(conn: Party.Connection) {
    delete this.state.participants[conn.id]
    this.checkAutoReveal()
    this.broadcast()
  }

  onMessage(message: string, sender: Party.Connection) {
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

    this.broadcast()
  }

  private getSelf(conn: Party.Connection): Participant | undefined {
    return this.state.participants[conn.id]
  }

  private checkAutoReveal() {
    if (this.state.phase === 'revealed') return
    const players = Object.values(this.state.participants).filter(p => !p.isSpectator)
    if (players.length > 0 && players.every(p => p.vote !== null)) {
      this.state.phase = 'revealed'
    }
  }

  private broadcast() {
    const msg: ServerMessage = { type: 'state', ...this.state }
    this.room.broadcast(JSON.stringify(msg))
  }
}

PokerRoom satisfies Party.Worker
