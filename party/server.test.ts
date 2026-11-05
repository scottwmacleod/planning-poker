import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Connection } from 'partyserver'

// partyserver imports `cloudflare:workers`, which only exists inside the
// Workers runtime. Swap in a minimal Server so the room logic runs in Node.
const { routePartykitRequest } = vi.hoisted(() => ({ routePartykitRequest: vi.fn() }))
vi.mock('partyserver', () => ({
  Server: class {
    broadcast = vi.fn()
    getConnections = vi.fn((): Connection[] => [])
  },
  routePartykitRequest,
}))

import worker, { MAX_CONNECTIONS_PER_ROOM, PokerRoom } from './server'

function makeConn(id: string): Connection {
  return { id, send: vi.fn(), close: vi.fn() } as unknown as Connection
}

function send(room: PokerRoom, conn: Connection, msg: object) {
  room.onMessage(conn, JSON.stringify(msg))
}

function join(room: PokerRoom, conn: Connection, name: string, isSpectator = false) {
  send(room, conn, { type: 'join', name, isSpectator })
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

    it('keeps the room deck when someone joins an emptied room', () => {
      const alice = makeConn('conn-1')
      join(room, alice, 'Alice')
      send(room, alice, { type: 'changeDeck', deck: 'tshirt' })
      room.onClose(alice)

      join(room, makeConn('conn-2'), 'Bob')
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

    it('lets the last person in when the room is at the cap', () => {
      const conn = makeConn('conn-1')
      vi.mocked(room.getConnections).mockReturnValue(Array(MAX_CONNECTIONS_PER_ROOM).fill(conn))
      room.onConnect(conn)
      expect(conn.close).not.toHaveBeenCalled()
      expect(conn.send).toHaveBeenCalled()
    })

    it('turns away a connection once the room is full', () => {
      const conn = makeConn('conn-1')
      vi.mocked(room.getConnections).mockReturnValue(Array(MAX_CONNECTIONS_PER_ROOM + 1).fill(conn))
      room.onConnect(conn)
      expect(conn.close).toHaveBeenCalledWith(4000, 'Room is full')
      expect(conn.send).not.toHaveBeenCalled()
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

describe('bad messages', () => {
  let room: PokerRoom
  let alice: Connection

  beforeEach(() => {
    room = new PokerRoom({} as DurableObjectState, {} as Env)
    alice = makeConn('alice')
    join(room, alice, 'Alice')
    vi.mocked(room.broadcast).mockClear()
  })

  function expectIgnored(raw: string) {
    const before = JSON.stringify(room.state)
    expect(() => room.onMessage(alice, raw)).not.toThrow()
    expect(JSON.stringify(room.state)).toBe(before)
    expect(room.broadcast).not.toHaveBeenCalled()
  }

  it.each([
    ['malformed JSON', '{not json'],
    ['JSON null', 'null'],
    ['a JSON string', '"vote"'],
    ['a JSON array', '[1,2]'],
    ['an unknown type', JSON.stringify({ type: 'explode' })],
    ['a missing type', JSON.stringify({ name: 'Mallory' })],
    ['vote without a value', JSON.stringify({ type: 'vote' })],
    ['vote with a non-string value', JSON.stringify({ type: 'vote', value: 5 })],
    ['vote not in the current deck', JSON.stringify({ type: 'vote', value: 'XL' })],
    ['vote with an arbitrary string', JSON.stringify({ type: 'vote', value: 'x'.repeat(1000) })],
    ['rename without a name', JSON.stringify({ type: 'rename' })],
    ['rename with a non-string name', JSON.stringify({ type: 'rename', name: 42 })],
    ['setSpectator with a non-boolean', JSON.stringify({ type: 'setSpectator', isSpectator: 'yes' })],
    ['changeDeck to an unknown deck', JSON.stringify({ type: 'changeDeck', deck: 'emoji' })],
    ['changeDeck without a deck', JSON.stringify({ type: 'changeDeck' })],
  ])('ignores %s', (_label, raw) => {
    expectIgnored(raw)
  })

  it('keeps working for everyone after junk', () => {
    const bob = makeConn('bob')
    room.onMessage(alice, '{not json')
    join(room, bob, 'Bob')
    send(room, alice, { type: 'vote', value: '3' })
    send(room, bob, { type: 'vote', value: '5' })
    expect(room.state.phase).toBe('revealed')
    expect(room.broadcast).toHaveBeenCalled()
  })

  describe('join', () => {
    function joinRaw(conn: Connection, msg: object) {
      room.onMessage(conn, JSON.stringify({ type: 'join', name: 'Bob', isSpectator: false, ...msg }))
    }

    it.each([
      ['an empty name', { name: '' }],
      ['a whitespace-only name', { name: '   ' }],
      ['a non-string name', { name: 7 }],
      ['a non-boolean isSpectator', { isSpectator: 'no' }],
    ])('rejects %s', (_label, msg) => {
      const bob = makeConn('bob')
      joinRaw(bob, msg)
      expect(room.state.participants['bob']).toBeUndefined()
      expect(room.broadcast).not.toHaveBeenCalled()
    })

    it('trims the name', () => {
      const bob = makeConn('bob')
      joinRaw(bob, { name: '  Bob  ' })
      expect(room.state.participants['bob'].name).toBe('Bob')
    })

    it('caps the name at 24 characters', () => {
      const bob = makeConn('bob')
      joinRaw(bob, { name: 'B'.repeat(100) })
      expect(room.state.participants['bob'].name).toBe('B'.repeat(24))
    })
  })

  describe('rename', () => {
    it('caps the name at 24 characters', () => {
      send(room, alice, { type: 'rename', name: '  ' + 'A'.repeat(100) })
      expect(room.state.participants['alice'].name).toBe('A'.repeat(24))
    })
  })

  describe('vote', () => {
    it('accepts a card from the current deck after a deck change', () => {
      send(room, alice, { type: 'changeDeck', deck: 'tshirt' })
      send(room, alice, { type: 'vote', value: 'XL' })
      expect(room.state.participants['alice'].vote).toBe('XL')
    })

    it('rejects a card from the other deck', () => {
      send(room, alice, { type: 'changeDeck', deck: 'tshirt' })
      vi.mocked(room.broadcast).mockClear()
      expectIgnored(JSON.stringify({ type: 'vote', value: '5' }))
    })

    it('accepts "?"', () => {
      send(room, alice, { type: 'vote', value: '?' })
      expect(room.state.participants['alice'].vote).toBe('?')
    })
  })
})

describe('worker fetch', () => {
  const env = {} as Env
  const requestFrom = (origin?: string) =>
    new Request('http://localhost/parties/main/room-1', origin ? { headers: { Origin: origin } } : undefined)

  beforeEach(() => routePartykitRequest.mockReset())

  it.each([
    'https://planning-poker-eta-neon.vercel.app',
    'https://planning-poker-9q72zv2vu-scottwmacleods-projects.vercel.app',
    'https://planning-poker-git-some-branch-scottwmacleods-projects.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ])('hands party requests from %s to the room server', async origin => {
    const request = requestFrom(origin)
    const response = new Response('ok')
    routePartykitRequest.mockResolvedValueOnce(response)
    expect(await worker.fetch(request, env)).toBe(response)
    expect(routePartykitRequest).toHaveBeenCalledWith(request, env)
  })

  it.each([
    ['another site', 'https://evil.example'],
    ['another Vercel site', 'https://planning-poker-copy.vercel.app'],
    ['a lookalike domain', 'https://planning-poker-eta-neon.vercel.app.evil.example'],
    ['plain http to production', 'http://planning-poker-eta-neon.vercel.app'],
    ['no origin', undefined],
  ])('refuses requests from %s', async (_, origin) => {
    const res = await worker.fetch(requestFrom(origin), env)
    expect(res.status).toBe(403)
    expect(routePartykitRequest).not.toHaveBeenCalled()
  })

  it('returns 404 for anything else', async () => {
    routePartykitRequest.mockResolvedValueOnce(null)
    const res = await worker.fetch(requestFrom('http://localhost:3000'), env)
    expect(res.status).toBe(404)
  })
})
