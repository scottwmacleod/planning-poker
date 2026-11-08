'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

const buttonBase =
  'focus-ring w-full rounded-1 border px-space-4 font-mono font-medium transition-colors'
const limeButton =
  'border-signal-ink bg-signal text-on-signal hover:bg-signal-ink hover:text-ground'

export default function Home() {
  const router = useRouter()
  const [joinId, setJoinId] = useState('')
  const canJoin = joinId.trim() !== ''

  function createRoom() {
    const id = nanoid(8)
    router.push(`/room/${id}`)
  }

  function joinRoom(e: React.FormEvent) {
    e.preventDefault()
    const id = joinId.trim()
    if (id) router.push(`/room/${id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink">
      <main className="flex flex-1 flex-col items-center justify-center gap-space-7 p-space-6">
        <div className="text-center">
          <h1 className="mb-space-2 font-mono text-4xl font-semibold">
            planning-poker
            <span
              aria-hidden="true"
              className="ml-space-1 inline-block h-[0.9em] w-[0.5em] translate-y-[0.1em] bg-signal"
            />
          </h1>
          <p className="font-mono text-ink-muted">estimate together, in real time</p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-space-5">
          <button onClick={createRoom} className={`${buttonBase} ${limeButton} py-space-4 text-lg`}>
            create room <span aria-hidden="true">→</span>
          </button>

          <div className="flex items-center gap-space-4">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-sm text-ink-muted">or join one that exists</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={joinRoom} className="flex flex-col gap-space-3">
            <label htmlFor="room-id" className="font-mono text-sm text-ink-muted">
              room id
            </label>
            <input
              id="room-id"
              type="text"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="e.g. abc12345"
              className="focus-ring w-full rounded-1 border border-control-line bg-surface px-space-4 py-space-3 text-ink placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={!canJoin}
              className={`${buttonBase} py-space-3 ${
                canJoin
                  ? limeButton
                  : 'cursor-not-allowed border-control-line bg-transparent text-ink-muted'
              }`}
            >
              join room
            </button>
          </form>
        </div>
      </main>

      <footer className="p-space-5 text-center font-mono text-sm">
        <a
          href="https://scottmacleod.co"
          className="focus-ring text-ink-muted underline underline-offset-4 hover:text-signal-ink"
        >
          by scottmacleod.co
        </a>
      </footer>
    </div>
  )
}
