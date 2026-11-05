import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Connection } from 'partyserver'

// partyserver imports `cloudflare:workers`, which only exists inside the
// Workers runtime. Swap in a minimal Server so the room logic runs in Node.
const { routePartykitRequest } = vi.hoisted(() => ({ routePartykitRequest: vi.fn() }))
vi.mock('partyserver', () => ({
  Server: class {
    broadcast = vi.fn()
  },
  routePartykitRequest,
}))

import worker, { PokerRoom } from './server'

function makeConn(id: string): Connection {
  return { id, send: vi.fn() } as unknown as Connection
}

function send(room: PokerRoom, conn: Connection, msg: object) {
  room.onMessage(conn, JSON.stringify(msg))
}

function join(room: PokerRoom, conn: Connection, name: string, isSpectator = false) {
  send(room, conn, { type: 'join', name, isSpectator, deck: 'fibonacci' })
}

describe('PokerRoom', () => {
  let room: PokerRoom

  beforeEach(() => {
    room = new PokerRoom({} as DurableObjectState, {} as Env)
  })

  describe('join', () => {
    it('adds participant to state', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      expect(room.state.participants['conn-1']).toMatchObject({ name: 'Alice', isSpectator: false, vote: null })
    })

    it('first player sets the deck', () => {
      const conn = makeConn('conn-1')
      send(room, conn, { type: 'join', name: 'Alice', isSpectator: false, deck: 'tshirt' })
      expect(room.state.deck).toBe('tshirt')
    })

    it('second player does not override deck', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      send(room, conn1, { type: 'join', name: 'Alice', isSpectator: false, deck: 'tshirt' })
      send(room, conn2, { type: 'join', name: 'Bob', isSpectator: false, deck: 'fibonacci' })
      expect(room.state.deck).toBe('tshirt')
    })
  })

  describe('vote', () => {
    it('records vote for player', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'vote', value: '5' })
      expect(room.state.participants['conn-1'].vote).toBe('5')
    })

    it('spectators cannot vote', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice', true)
      send(room, conn, { type: 'vote', value: '5' })
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('votes blocked after reveal', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'reveal' })
      send(room, conn, { type: 'vote', value: '5' })
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('auto-reveal', () => {
    it('reveals when all players vote', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Bob')
      send(room, conn1, { type: 'vote', value: '3' })
      expect(room.state.phase).toBe('voting')
      send(room, conn2, { type: 'vote', value: '5' })
      expect(room.state.phase).toBe('revealed')
    })

    it('spectators do not block auto-reveal', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Spectator', true)
      send(room, conn1, { type: 'vote', value: '3' })
      expect(room.state.phase).toBe('revealed')
    })
  })

  describe('reveal', () => {
    it('sets phase to revealed', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'reveal' })
      expect(room.state.phase).toBe('revealed')
    })
  })

  describe('newRound', () => {
    it('resets phase and clears votes', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'vote', value: '5' })
      send(room, conn, { type: 'reveal' })
      send(room, conn, { type: 'newRound' })
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('changeDeck', () => {
    it('changes deck and resets round', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'vote', value: '5' })
      send(room, conn, { type: 'reveal' })
      send(room, conn, { type: 'changeDeck', deck: 'tshirt' })
      expect(room.state.deck).toBe('tshirt')
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })
  })

  describe('rename', () => {
    it('updates participant name', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'rename', name: 'Alicia' })
      expect(room.state.participants['conn-1'].name).toBe('Alicia')
    })

    it('trims whitespace', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'rename', name: '  Bob  ' })
      expect(room.state.participants['conn-1'].name).toBe('Bob')
    })

    it('ignores blank name', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'rename', name: '   ' })
      expect(room.state.participants['conn-1'].name).toBe('Alice')
    })

    it('ignores rename from unknown connection', () => {
      const conn = makeConn('conn-1')
      send(room, conn, { type: 'rename', name: 'Ghost' })
      expect(room.state.participants['conn-1']).toBeUndefined()
    })

    it('preserves vote and spectator status', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'vote', value: '5' })
      send(room, conn, { type: 'rename', name: 'Alicia' })
      expect(room.state.participants['conn-1']).toMatchObject({ name: 'Alicia', vote: '5', isSpectator: false })
    })
  })

  describe('setSpectator', () => {
    it('switches a player to a spectator', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'setSpectator', isSpectator: true })
      expect(room.state.participants['conn-1'].isSpectator).toBe(true)
    })

    it('switches a spectator to a player', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice', true)
      send(room, conn, { type: 'setSpectator', isSpectator: false })
      expect(room.state.participants['conn-1'].isSpectator).toBe(false)
    })

    it('clears vote when switching to spectator', () => {
      const conn = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn, 'Alice')
      join(room, conn2, 'Bob')
      send(room, conn, { type: 'vote', value: '5' })
      send(room, conn, { type: 'setSpectator', isSpectator: true })
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('triggers auto-reveal if remaining players already voted', () => {
      const conn = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn, 'Alice')
      join(room, conn2, 'Bob')
      send(room, conn2, { type: 'vote', value: '5' })
      send(room, conn, { type: 'setSpectator', isSpectator: true })
      expect(room.state.phase).toBe('revealed')
    })

    it('ignores setSpectator from unknown connection', () => {
      const conn = makeConn('conn-1')
      send(room, conn, { type: 'setSpectator', isSpectator: true })
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
      send(room, conn1, { type: 'vote', value: '3' })
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
      expect(room.broadcast).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('newRound is idempotent when already in voting phase', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      send(room, conn, { type: 'newRound' })
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('unknown message type is silently ignored', () => {
      const conn = makeConn('conn-1')
      join(room, conn, 'Alice')
      const stateBefore = JSON.stringify(room.state)
      send(room, conn, { type: 'unknown_action' })
      expect(JSON.stringify(room.state)).toBe(stateBefore)
    })

    it('changeDeck during active voting clears votes and stays in voting', () => {
      const conn1 = makeConn('conn-1')
      const conn2 = makeConn('conn-2')
      join(room, conn1, 'Alice')
      join(room, conn2, 'Bob')
      send(room, conn1, { type: 'vote', value: '5' })
      send(room, conn1, { type: 'changeDeck', deck: 'tshirt' })
      expect(room.state.deck).toBe('tshirt')
      expect(room.state.phase).toBe('voting')
      expect(room.state.participants['conn-1'].vote).toBeNull()
    })

    it('auto-reveal does not fire on empty room', () => {
      expect(room.state.phase).toBe('voting')
    })
  })
})

describe('worker fetch', () => {
  const env = {} as Env
  const request = new Request('http://localhost/parties/main/room-1')

  it('hands party requests to the room server', async () => {
    const response = new Response('ok')
    routePartykitRequest.mockResolvedValueOnce(response)
    expect(await worker.fetch(request, env)).toBe(response)
    expect(routePartykitRequest).toHaveBeenCalledWith(request, env)
  })

  it('returns 404 for anything else', async () => {
    routePartykitRequest.mockResolvedValueOnce(null)
    const res = await worker.fetch(request, env)
    expect(res.status).toBe(404)
  })
})
