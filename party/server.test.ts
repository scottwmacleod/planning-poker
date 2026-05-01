import { describe, it, expect, vi, beforeEach } from 'vitest'
import type * as Party from 'partykit/server'
import PokerRoom from './server'

function makeRoom(): Party.Room {
  return { broadcast: vi.fn() } as unknown as Party.Room
}

function makeConn(id: string): Party.Connection {
  return { id, send: vi.fn() } as unknown as Party.Connection
}

function join(room: PokerRoom, conn: Party.Connection, name: string, isSpectator = false) {
  room.onMessage(JSON.stringify({ type: 'join', name, isSpectator, deck: 'fibonacci' }), conn)
}

describe('PokerRoom', () => {
  let room: PokerRoom
  let mockRoom: Party.Room

  beforeEach(() => {
    mockRoom = makeRoom()
    room = new PokerRoom(mockRoom)
  })

  describe('join', () => {
    it('adds participant to state', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      expect(room.state.participants['conn-1']).toMatchObject({ name: 'Alice', isSpectator: false, vote: null })
    })

    it('first player sets the deck', () => {
      const conn = makeConn('conn-1')
      room.onMessage(JSON.stringify({ type: 'join', name: 'Alice', isSpectator: false, deck: 'tshirt' }), conn)
      expect(room.state.deck).toBe('tshirt')
    })

    it('second player does not override deck', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      room.onMessage(JSON.stringify({ type: 'join', name: 'Alice', isSpectator: false, deck: 'tshirt' }), conn1)
      room.onMessage(JSON.stringify({ type: 'join', name: 'Bob', isSpectator: false, deck: 'fibonacci' }), conn2)
      expect(room.state.deck).toBe('tshirt')
    })
  })

  describe('vote', () => {
    it('records vote for player', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      expect(room.state.participants['conn-1'].vote).toBe('5')
    })

    it('spectators cannot vote', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice', true)
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('votes blocked after reveal', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'reveal' }), conn)
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('auto-reveal', () => {
    it('reveals when all players vote', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Bob')
      room.onMessage(JSON.stringify({ type: 'vote', value: '3' }), conn1)
      expect(room.state.phase).toBe('voting')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn2)
      expect(room.state.phase).toBe('revealed')
    })

    it('spectators do not block auto-reveal', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Spectator', true)
      room.onMessage(JSON.stringify({ type: 'vote', value: '3' }), conn1)
      expect(room.state.phase).toBe('revealed')
    })
  })

  describe('reveal', () => {
    it('sets phase to revealed', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'reveal' }), conn)
      expect(room.state.phase).toBe('revealed')
    })
  })

  describe('newRound', () => {
    it('resets phase and clears votes', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      room.onMessage(JSON.stringify({ type: 'reveal' }), conn)
      room.onMessage(JSON.stringify({ type: 'newRound' }), conn)
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('changeDeck', () => {
    it('changes deck and resets round', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      room.onMessage(JSON.stringify({ type: 'reveal' }), conn)
      room.onMessage(JSON.stringify({ type: 'changeDeck', deck: 'tshirt' }), conn)
      expect(room.state.deck).toBe('tshirt')
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('onClose', () => {
    it('removes participant on disconnect', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onClose(conn)
      expect(room.state.participants['conn-1']).toBeUndefined()
    })

    it('triggers auto-reveal if remaining players all voted', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Bob')
      room.onMessage(JSON.stringify({ type: 'vote', value: '3' }), conn1)
      room.onClose(conn2)
      expect(room.state.phase).toBe('revealed')
    })
  })

  describe('onConnect', () => {
    it('sends current state to new connection', () => {
      const conn = makeConn('conn-1')
      room.onConnect(conn)
      expect(conn.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'state', participants: {}, phase: 'voting', deck: 'fibonacci' })
      )
    })
  })

  describe('broadcast', () => {
    it('broadcasts state after each message', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      expect(mockRoom.broadcast).toHaveBeenCalled()
    })
  })
})
