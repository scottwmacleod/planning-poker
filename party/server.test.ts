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

  describe('rename', () => {
    it('updates participant name', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'rename', name: 'Alicia' }), conn)
      expect(room.state.participants['conn-1'].name).toBe('Alicia')
    })

    it('trims whitespace', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'rename', name: '  Bob  ' }), conn)
      expect(room.state.participants['conn-1'].name).toBe('Bob')
    })

    it('ignores blank name', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'rename', name: '   ' }), conn)
      expect(room.state.participants['conn-1'].name).toBe('Alice')
    })

    it('ignores rename from unknown connection', () => {
      const conn = makeConn('conn-1')
      room.onMessage(JSON.stringify({ type: 'rename', name: 'Ghost' }), conn)
      expect(room.state.participants['conn-1']).toBeUndefined()
    })

    it('preserves vote and spectator status', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      room.onMessage(JSON.stringify({ type: 'rename', name: 'Alicia' }), conn)
      expect(room.state.participants['conn-1']).toMatchObject({ name: 'Alicia', vote: '5', isSpectator: false })
    })
  })

  describe('setSpectator', () => {
    it('switches a player to a spectator', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'setSpectator', isSpectator: true }), conn)
      expect(room.state.participants['conn-1'].isSpectator).toBe(true)
    })

    it('switches a spectator to a player', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice', true)
      room.onMessage(JSON.stringify({ type: 'setSpectator', isSpectator: false }), conn)
      expect(room.state.participants['conn-1'].isSpectator).toBe(false)
    })

    it('clears vote when switching to spectator', () => {
      const conn = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn, 'Alice')
      join(room, conn2, 'Bob')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn)
      room.onMessage(JSON.stringify({ type: 'setSpectator', isSpectator: true }), conn)
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('triggers auto-reveal if remaining players already voted', () => {
      const conn = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn, 'Alice')
      join(room, conn2, 'Bob')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn2)
      room.onMessage(JSON.stringify({ type: 'setSpectator', isSpectator: true }), conn)
      expect(room.state.phase).toBe('revealed')
    })

    it('ignores setSpectator from unknown connection', () => {
      const conn = makeConn('conn-1')
      room.onMessage(JSON.stringify({ type: 'setSpectator', isSpectator: true }), conn)
      expect(room.state.participants['conn-1']).toBeUndefined()
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

    it('does not reveal when last player disconnects without voting', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onClose(conn)
      expect(room.state.phase).toBe('voting')
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

  describe('edge cases', () => {
    it('newRound is idempotent when already in voting phase', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      room.onMessage(JSON.stringify({ type: 'newRound' }), conn)
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('unknown message type is silently ignored', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      const stateBefore = JSON.stringify(room.state)
      room.onMessage(JSON.stringify({ type: 'unknown_action' }), conn)
      expect(JSON.stringify(room.state)).toBe(stateBefore)
    })

    it('changeDeck during active voting clears votes and stays in voting', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Bob')
      room.onMessage(JSON.stringify({ type: 'vote', value: '5' }), conn1)
      room.onMessage(JSON.stringify({ type: 'changeDeck', deck: 'tshirt' }), conn1)
      expect(room.state.deck).toBe('tshirt')
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('auto-reveal does not fire on empty room', () => {
      expect(room.state.phase).toBe('voting')
    })
  })
})
