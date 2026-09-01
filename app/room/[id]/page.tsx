'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import PartySocket from 'partysocket'
import CardDeck from '../../../components/CardDeck'
import ParticipantList from '../../../components/ParticipantList'
import VoteResults from '../../../components/VoteResults'
import type { ClientMessage, Participant, RoomState, ServerMessage } from '../../../lib/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

const ghostButtonClass = 'text-sm text-gray-400 hover:text-white transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-sm'

function persistName(n: string) {
  localStorage.setItem('poker-name', n)
}

function persistSpectator(v: boolean) {
  localStorage.setItem('poker-spectator', String(v))
}

function NameEditor({
  participant,
  editing,
  inputRef,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  participant: Participant
  editing: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onStartEdit: () => void
  onCommit: () => void
  onCancel: () => void
}) {
  if (editing) {
    return (
      <form onSubmit={e => { e.preventDefault(); onCommit() }}>
        <label htmlFor="rename-input" className="sr-only">Your name</label>
        <input
          id="rename-input"
          ref={inputRef}
          autoFocus
          defaultValue={participant.name}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
          maxLength={24}
          className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white w-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      </form>
    )
  }

  return (
    <button onClick={onStartEdit} className={ghostButtonClass}>
      {participant.name} <span aria-hidden="true">✎</span>
      <span className="sr-only">Edit your name</span>
    </button>
  )
}

function SpectatorToggle({ participant, onToggle }: { participant: Participant; onToggle: () => void }) {
  const label = participant.isSpectator
    ? { icon: '👁', text: 'Observing', action: 'join voting' }
    : { icon: '🃏', text: 'Playing', action: 'switch to observing' }

  return (
    <button onClick={onToggle} aria-pressed={participant.isSpectator} className={ghostButtonClass}>
      <span aria-hidden="true">{label.icon}</span> {label.text}
      <span className="sr-only"> — click to {label.action}</span>
    </button>
  )
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState<string | null>(null)
  const [isSpectator, setIsSpectator] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myId, setMyId] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const socketRef = useRef<PartySocket | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  // These track what was actually sent to the server, so a socket reconnect
  // (which re-runs the 'open' handler below) rejoins with the latest values
  // instead of the stale ones `name`/`isSpectator` were initialized to.
  const liveNameRef = useRef<string | null>(null)
  const liveSpectatorRef = useRef(false)

  useEffect(() => {
    const storedName = localStorage.getItem('poker-name')
    const storedSpectator = localStorage.getItem('poker-spectator')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedName) setName(storedName)
    if (storedSpectator !== null) setIsSpectator(storedSpectator === 'true')
  }, [])

  useEffect(() => {
    if (!name) return
    liveNameRef.current = name
    liveSpectatorRef.current = isSpectator

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: id,
    })

    socketRef.current = socket

    socket.addEventListener('open', () => {
      setMyId(socket.id)
      const msg: ClientMessage = {
        type: 'join',
        name: liveNameRef.current ?? name,
        isSpectator: liveSpectatorRef.current,
        deck: 'fibonacci',
      }
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
    persistName(n)
    persistSpectator(isSpectator)
    setName(n)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function commitRename() {
    if (!isEditingName) return
    setIsEditingName(false)
    const n = nameInputRef.current?.value.trim() ?? ''
    if (!n || n === myParticipant?.name) return
    persistName(n)
    liveNameRef.current = n
    send({ type: 'rename', name: n })
  }

  function toggleSpectator() {
    if (!myParticipant) return
    const next = !myParticipant.isSpectator
    liveSpectatorRef.current = next
    persistSpectator(next)
    send({ type: 'setSpectator', isSpectator: next })
  }

  if (!name) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-6">
        <h1 className="text-3xl font-bold">Join Room</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="player-name" className="text-sm text-gray-400">Your name</label>
            <input
              id="player-name"
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={24}
              className="w-full py-3 px-4 bg-gray-900 border border-gray-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 text-white placeholder-gray-400 text-base"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpectator}
              onChange={e => setIsSpectator(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            />
            <span className="text-gray-300">I&apos;m just observing</span>
          </label>
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors text-base touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
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
        <p role="status" className="text-gray-400">Connecting…</p>
      </main>
    )
  }

  const myParticipant = roomState.participants[myId]
  const myVote = myParticipant?.vote ?? null
  const players = Object.values(roomState.participants).filter(p => !p.isSpectator)
  const votedCount = players.filter(p => p.vote !== null).length

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Screen reader phase announcer */}
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {roomState.phase === 'voting' ? 'Voting in progress' : 'Cards revealed'}
      </p>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium">
            <span className="text-gray-400 font-normal">Room </span>
            <span className="font-mono">{id}</span>
          </h1>
          {myParticipant && (
            <>
              <NameEditor
                participant={myParticipant}
                editing={isEditingName}
                inputRef={nameInputRef}
                onStartEdit={() => setIsEditingName(true)}
                onCommit={commitRename}
                onCancel={() => setIsEditingName(false)}
              />
              <SpectatorToggle participant={myParticipant} onToggle={toggleSpectator} />
            </>
          )}
        </div>
        <div>
          <button onClick={copyLink} className={ghostButtonClass}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {copied ? 'Room link copied to clipboard' : ''}
          </div>
        </div>
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
                <p aria-live="polite" className="text-gray-400 text-sm">
                  {votedCount} / {players.length} voted
                </p>
                {myParticipant?.isSpectator && (
                  <p className="text-gray-400 text-sm mt-1">Observing</p>
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
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
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
