'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'

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
              className="cursor-blink ml-space-1 inline-block h-[0.9em] w-[0.5em] translate-y-[0.1em] bg-signal"
            />
          </h1>
          <p className="font-mono text-ink-muted">estimate together, in real time</p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-space-5">
          <Button variant="signal" size="lg" onClick={createRoom} className="w-full">
            create room <span aria-hidden="true">→</span>
          </Button>

          <div className="flex items-center gap-space-4">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-sm text-ink-muted">or join one that exists</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={joinRoom} className="flex flex-col gap-space-3">
            <Field
              id="room-id"
              label="room id"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="e.g. abc12345"
            />
            <Button type="submit" variant="signal" size="md" disabled={!canJoin} className="w-full">
              join room
            </Button>
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
