'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

export default function Home() {
  const router = useRouter()
  const [joinId, setJoinId] = useState('')

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
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-12 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Planning Poker</h1>
        <p className="text-gray-400">Estimate together, in real time</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-sm">
        <button
          onClick={createRoom}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          Create Room
        </button>

        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-400 text-sm">or join existing</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <form onSubmit={joinRoom} className="flex flex-col gap-3">
          <label htmlFor="room-id" className="text-sm text-gray-400">Room ID</label>
          <input
            id="room-id"
            type="text"
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            placeholder="e.g. abc12345"
            className="w-full py-3 px-4 bg-gray-900 border border-gray-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!joinId.trim()}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Join Room
          </button>
        </form>
      </div>
    </main>
  )
}
