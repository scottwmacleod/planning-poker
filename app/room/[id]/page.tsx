'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import PartySocket from 'partysocket'
import CardDeck from '../../../components/CardDeck'
import ParticipantList from '../../../components/ParticipantList'
import VoteResults from '../../../components/VoteResults'
import type { ClientMessage, RoomState, ServerMessage } from '../../../lib/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState<string | null>(null)
  const [isSpectator, setIsSpectator] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myId, setMyId] = useState<string>('')
  const socketRef = useRef<PartySocket | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('poker-name')
    if (stored) setName(stored)
  }, [])

  useEffect(() => {
    if (!name) return

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: id,
    })

    socketRef.current = socket
    setMyId(socket.id)

    socket.addEventListener('open', () => {
      const msg: ClientMessage = { type: 'join', name, isSpectator, deck: 'fibonacci' }
      socket.send(JSON.stringify(msg))
    })

    socket.addEventListener('message', (e: MessageEvent) => {
      const data: ServerMessage = JSON.parse(e.data)
      if (data.type === 'state') {
        setRoomState({ participants: data.participants, phase: data.phase, deck: data.deck })
      }
    })

    return () => socket.close()
  }, [name, id, isSpectator])

  function send(msg: ClientMessage) {
    socketRef.current?.send(JSON.stringify(msg))
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const n = nameInput.trim()
    if (!n) return
    localStorage.setItem('poker-name', n)
    setName(n)
  }

  if (!name) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-6">
        <h1 className="text-3xl font-bold">Join Room</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-sm">
          <input
            autoFocus
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="w-full py-3 px-4 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 text-base"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpectator}
              onChange={e => setIsSpectator(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-gray-300">I&apos;m just observing</span>
          </label>
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors text-base touch-manipulation"
          >
            Enter Room
          </button>
        </form>
      </main>
    )
  }

  if (!roomState) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Connecting…</p>
      </main>
    )
  }

  const myParticipant = roomState.participants[myId]
  const myVote = myParticipant?.vote ?? null
  const players = Object.values(roomState.participants).filter(p => !p.isSpectator)
  const votedCount = players.filter(p => p.vote !== null).length

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 shrink-0">
        <div>
          <span className="text-sm text-gray-400">Room </span>
          <span className="font-mono text-sm font-medium">{id}</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="text-sm text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          Copy link
        </button>
      </header>

      {/* Mobile: participants strip */}
      <div className="md:hidden border-b border-gray-800 px-3">
        <ParticipantList
          participants={roomState.participants}
          phase={roomState.phase}
          myId={myId}
          compact
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: sidebar */}
        <aside className="hidden md:block w-56 shrink-0 p-6 border-r border-gray-800 overflow-y-auto">
          <ParticipantList
            participants={roomState.participants}
            phase={roomState.phase}
            myId={myId}
          />
        </aside>

        {/* Main content */}
        <section className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 p-4 sm:p-6 overflow-y-auto">
          {roomState.phase === 'voting' ? (
            <>
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  {votedCount} / {players.length} voted
                </p>
                {myParticipant?.isSpectator && (
                  <p className="text-gray-500 text-sm mt-1">Observing</p>
                )}
              </div>

              {!myParticipant?.isSpectator && (
                <CardDeck
                  deck={roomState.deck}
                  selectedCard={myVote}
                  onVote={val => send({ type: 'vote', value: val })}
                  onChangeDeck={deck => send({ type: 'changeDeck', deck })}
                  disabled={false}
                />
              )}

              <button
                onClick={() => send({ type: 'reveal' })}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors touch-manipulation"
              >
                Flip Cards
              </button>
            </>
          ) : (
            <VoteResults
              participants={roomState.participants}
              onNewRound={() => send({ type: 'newRound' })}
            />
          )}
        </section>
      </div>
    </main>
  )
}
