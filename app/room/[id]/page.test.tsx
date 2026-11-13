import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomPage from './page'
import type { ClientMessage, Participant, RoomState } from '../../../lib/types'

// A stand-in for PartySocket: no network, just records what the page sends
// and lets the test fire 'open' / 'message' events by hand.
const { FakeSocket, sockets } = vi.hoisted(() => {
  const sockets: InstanceType<typeof FakeSocket>[] = []

  class FakeSocket {
    id = 'me'
    sent: ClientMessage[] = []
    closed = false
    private listeners: Record<string, ((e: unknown) => void)[]> = {}

    constructor(public options: { host: string; room: string }) {
      sockets.push(this)
    }

    addEventListener(type: string, fn: (e: unknown) => void) {
      ;(this.listeners[type] ??= []).push(fn)
    }

    send(raw: string) {
      this.sent.push(JSON.parse(raw))
    }

    close() {
      this.closed = true
    }

    open() {
      this.listeners.open?.forEach(fn => fn({}))
    }

    serverClose(code: number) {
      this.listeners.close?.forEach(fn => fn({ code }))
    }

    receive(data: unknown) {
      this.listeners.message?.forEach(fn => fn({ data: JSON.stringify(data) }))
    }
  }

  return { FakeSocket, sockets }
})

vi.mock('partysocket', () => ({ default: FakeSocket }))

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'abc123' }),
}))

function me(overrides: Partial<Participant> = {}): Participant {
  return { id: 'me', name: 'Alice', isSpectator: false, vote: null, ...overrides }
}

function state(overrides: Partial<RoomState> = {}): RoomState & { type: 'state' } {
  return {
    type: 'state',
    participants: { me: me() },
    phase: 'voting',
    deck: 'fibonacci',
    ...overrides,
  }
}

function socket() {
  const live = sockets.filter(s => !s.closed)
  expect(live).toHaveLength(1)
  return live[0]
}

function sentOf(type: ClientMessage['type']) {
  return socket().sent.filter(m => m.type === type)
}

const observerState = () => state({ participants: { me: me({ isSpectator: true }) } })

async function renameTo(user: ReturnType<typeof userEvent.setup>, keys: string) {
  await user.click(screen.getByRole('button', { name: /edit your name/i }))
  const input = screen.getByRole('textbox', { name: 'Your name' })
  await user.clear(input)
  await user.type(input, keys)
}

// Render with a stored name, open the socket and deliver the first state.
async function renderInRoom(roomState = state()) {
  localStorage.setItem('poker-name', 'Alice')
  render(<RoomPage />)
  await act(async () => {
    socket().open()
    socket().receive(roomState)
  })
}

beforeEach(() => {
  sockets.length = 0
  localStorage.clear()
})

describe('RoomPage', () => {
  describe('room server host', () => {
    afterEach(() => vi.unstubAllEnvs())

    function connectedHost() {
      localStorage.setItem('poker-name', 'Alice')
      render(<RoomPage />)
      return socket().options.host
    }

    it('uses NEXT_PUBLIC_ROOM_SERVER_HOST', () => {
      vi.stubEnv('NEXT_PUBLIC_ROOM_SERVER_HOST', 'rooms.example.dev')
      vi.stubEnv('NEXT_PUBLIC_PARTYKIT_HOST', 'old.example.dev')
      expect(connectedHost()).toBe('rooms.example.dev')
    })

    it('falls back to the old NEXT_PUBLIC_PARTYKIT_HOST while it is still set', () => {
      vi.stubEnv('NEXT_PUBLIC_ROOM_SERVER_HOST', undefined)
      vi.stubEnv('NEXT_PUBLIC_PARTYKIT_HOST', 'old.example.dev')
      expect(connectedHost()).toBe('old.example.dev')
    })

    it('defaults to the local room server', () => {
      vi.stubEnv('NEXT_PUBLIC_ROOM_SERVER_HOST', undefined)
      vi.stubEnv('NEXT_PUBLIC_PARTYKIT_HOST', undefined)
      expect(connectedHost()).toBe('localhost:1999')
    })
  })

  describe('joining', () => {
    it('shows the join form when no name is stored', () => {
      render(<RoomPage />)
      expect(screen.getByRole('heading', { name: 'join room' })).toBeInTheDocument()
      expect(sockets).toHaveLength(0)
    })

    it('saves the name and observer choice, then sends join', async () => {
      const user = userEvent.setup()
      render(<RoomPage />)

      await user.type(screen.getByLabelText('your name'), '  Bob  ')
      await user.click(screen.getByRole('checkbox', { name: /just observing/i }))
      await user.click(screen.getByRole('button', { name: 'enter room' }))

      expect(localStorage.getItem('poker-name')).toBe('Bob')
      expect(localStorage.getItem('poker-spectator')).toBe('true')

      act(() => socket().open())
      expect(socket().sent).toEqual([
        { type: 'join', name: 'Bob', isSpectator: true },
      ])
    })

    it('does not let you join with a blank name', async () => {
      const user = userEvent.setup()
      render(<RoomPage />)

      await user.type(screen.getByLabelText('your name'), '   ')

      expect(screen.getByRole('button', { name: 'enter room' })).toBeDisabled()
      expect(sockets).toHaveLength(0)
    })

    it('connects straight away with a stored name and shows Connecting… until the first state', async () => {
      localStorage.setItem('poker-name', 'Alice')
      localStorage.setItem('poker-spectator', 'true')
      render(<RoomPage />)

      expect(screen.queryByRole('heading', { name: 'join room' })).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Connecting…')

      act(() => socket().open())
      expect(socket().sent).toEqual([
        { type: 'join', name: 'Alice', isSpectator: true },
      ])
      expect(screen.getByRole('status')).toHaveTextContent('Connecting…')

      act(() => socket().receive(observerState()))
      expect(screen.queryByText('Connecting…')).not.toBeInTheDocument()
      expect(screen.getByText('abc123')).toBeInTheDocument()
    })
  })

  describe('renaming', () => {
    async function renameInRoom(keys: string) {
      const user = userEvent.setup()
      await renderInRoom()
      await renameTo(user, keys)
      return user
    }

    it('sends rename on Enter and saves the new name', async () => {
      await renameInRoom('Carol{Enter}')

      expect(sentOf('rename')).toEqual([{ type: 'rename', name: 'Carol' }])
      expect(localStorage.getItem('poker-name')).toBe('Carol')
      expect(screen.queryByRole('textbox', { name: 'Your name' })).not.toBeInTheDocument()
    })

    it('sends rename on blur', async () => {
      const user = await renameInRoom('Carol')
      await user.click(document.body)

      expect(sentOf('rename')).toEqual([{ type: 'rename', name: 'Carol' }])
    })

    it('Escape cancels without sending anything', async () => {
      await renameInRoom('Carol{Escape}')

      expect(screen.queryByRole('textbox', { name: 'Your name' })).not.toBeInTheDocument()
      expect(sentOf('rename')).toEqual([])
      expect(localStorage.getItem('poker-name')).toBe('Alice')
    })

    it('sends nothing for an empty name', async () => {
      await renameInRoom('   {Enter}')

      expect(sentOf('rename')).toEqual([])
      expect(localStorage.getItem('poker-name')).toBe('Alice')
    })

    it('sends nothing when the name is unchanged', async () => {
      await renameInRoom('Alice{Enter}')

      expect(sentOf('rename')).toEqual([])
    })
  })

  describe('header', () => {
    it('titles the page planning-poker and shows the room code', async () => {
      await renderInRoom()

      expect(screen.getByRole('heading', { level: 1, name: 'planning-poker' })).toBeInTheDocument()
      expect(screen.getByText('abc123')).toBeInTheDocument()
    })

    it('labels the observer toggle in plain words without emoji', async () => {
      await renderInRoom()

      const toggle = screen.getByRole('button', { name: /switch to observing/i })
      expect(toggle).toHaveTextContent('playing')
      expect(toggle.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    })
  })

  describe('observer toggle', () => {
    it('sends setSpectator and saves the choice', async () => {
      const user = userEvent.setup()
      await renderInRoom()

      await user.click(screen.getByRole('button', { name: /switch to observing/i }))

      expect(sentOf('setSpectator')).toEqual([{ type: 'setSpectator', isSpectator: true }])
      expect(localStorage.getItem('poker-spectator')).toBe('true')
    })

    it('switching back to playing sends isSpectator false', async () => {
      const user = userEvent.setup()
      await renderInRoom(observerState())

      await user.click(screen.getByRole('button', { name: /join voting/i }))

      expect(sentOf('setSpectator')).toEqual([{ type: 'setSpectator', isSpectator: false }])
      expect(localStorage.getItem('poker-spectator')).toBe('false')
    })
  })

  describe('reconnecting', () => {
    it('rejoins with the latest name and observer status, not the original ones', async () => {
      const user = userEvent.setup()
      await renderInRoom()

      await renameTo(user, 'Carol{Enter}')
      act(() => socket().receive(state({ participants: { me: me({ name: 'Carol' }) } })))

      await user.click(screen.getByRole('button', { name: /switch to observing/i }))

      // PartySocket reconnects on the same instance and fires 'open' again.
      act(() => socket().open())

      const joins = sentOf('join')
      expect(joins).toHaveLength(2)
      expect(joins[1]).toEqual({ type: 'join', name: 'Carol', isSpectator: true })
    })
  })

  describe('full room', () => {
    it('stops reconnecting and says the room is full', async () => {
      localStorage.setItem('poker-name', 'Alice')
      render(<RoomPage />)
      const s = socket()
      await act(async () => s.serverClose(4000))

      expect(s.closed).toBe(true)
      expect(screen.getByRole('status')).toHaveTextContent(/room is full/i)
    })

    it('keeps reconnecting after an ordinary disconnect', async () => {
      await renderInRoom()
      const s = socket()
      await act(async () => s.serverClose(1006))
      expect(s.closed).toBe(false)
    })
  })

  describe('phases', () => {
    it('gives flip cards press feedback', async () => {
      await renderInRoom(state({ participants: { me: me() } }))
      expect(screen.getByRole('button', { name: 'flip cards' })).toHaveClass('press')
    })

    it('voting phase shows the deck, vote count and flip cards, which sends reveal', async () => {
      const user = userEvent.setup()
      await renderInRoom(state({
        participants: {
          me: me({ vote: '5' }),
          bob: me({ id: 'bob', name: 'Bob' }),
        },
      }))

      expect(screen.getByRole('group', { name: 'Card deck' })).toBeInTheDocument()
      expect(screen.getByText(/of 2 voted/)).toHaveTextContent('1 of 2 voted')
      expect(screen.queryByRole('button', { name: 'new round' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'flip cards' }))
      expect(sentOf('reveal')).toEqual([{ type: 'reveal' }])
    })

    it('voting phase hides the deck for an observer', async () => {
      await renderInRoom(observerState())

      expect(screen.queryByRole('group', { name: 'Card deck' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'flip cards' })).toBeInTheDocument()
    })

    it('revealed phase shows results and new round instead of the deck', async () => {
      const user = userEvent.setup()
      await renderInRoom(state({ phase: 'revealed', participants: { me: me({ vote: '5' }) } }))

      expect(screen.queryByRole('group', { name: 'Card deck' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'flip cards' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'new round' }))
      expect(sentOf('newRound')).toEqual([{ type: 'newRound' }])
    })
  })

  describe('copy link', () => {
    // userEvent.setup() installs its own clipboard stub, so these run after it.
    function mockClipboard(writeText: () => Promise<void>) {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    }

    it('says copied once the link is on the clipboard', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn(() => Promise.resolve())
      mockClipboard(writeText)
      await renderInRoom()

      await user.click(screen.getByRole('button', { name: 'copy link' }))

      expect(writeText).toHaveBeenCalledWith(window.location.href)
      expect(screen.getByRole('button', { name: 'copied' })).toBeInTheDocument()
      expect(screen.getByText('Room link copied to clipboard')).toBeInTheDocument()
    })

    it('says it could not copy when the browser blocks the clipboard', async () => {
      const user = userEvent.setup()
      mockClipboard(() => Promise.reject(new Error('NotAllowedError')))
      await renderInRoom()

      await user.click(screen.getByRole('button', { name: 'copy link' }))

      expect(screen.queryByText('copied')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'copy failed' })).toBeInTheDocument()
      expect(screen.getByText(/couldn't copy the link/i)).toBeInTheDocument()
    })

    it('says it could not copy when the clipboard is unavailable', async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
      await renderInRoom()

      await user.click(screen.getByRole('button', { name: 'copy link' }))

      expect(screen.queryByText('copied')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'copy failed' })).toBeInTheDocument()
    })
  })
})
