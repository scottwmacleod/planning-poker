'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import PartySocket from 'partysocket'
import CardDeck from '../../../components/CardDeck'
import ParticipantList from '../../../components/ParticipantList'
import VoteResults from '../../../components/VoteResults'
import { ROOM_FULL_CODE, type ClientMessage, type Participant, type RoomState, type ServerMessage } from '../../../lib/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

const outlineButtonClass = 'focus-ring border border-control-line px-3 py-1 font-mono text-sm text-ink hover:border-ink touch-manipulation'
const primaryButtonClass = 'focus-ring w-full bg-signal px-4 py-4 font-mono text-base font-semibold text-on-signal hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation'
const inputClass = 'focus-ring w-full border border-control-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted'

const COPY_LABELS = { idle: 'copy link', copied: 'copied', failed: 'copy failed' }
const COPY_ANNOUNCEMENTS = {
  idle: '',
  copied: 'Room link copied to clipboard',
  failed: "Couldn't copy the link. Copy it from the address bar instead.",
}

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
          className="focus-ring w-28 border border-control-line bg-surface px-2 py-1 text-sm text-ink"
        />
      </form>
    )
  }

  return (
    <button onClick={onStartEdit} className={outlineButtonClass}>
      {participant.name} <span aria-hidden="true">✎</span>
      <span className="sr-only">Edit your name</span>
    </button>
  )
}

function SpectatorToggle({ participant, onToggle }: { participant: Participant; onToggle: () => void }) {
  const label = participant.isSpectator
    ? { text: 'observing', action: 'join voting' }
    : { text: 'playing', action: 'switch to observing' }

  return (
    <button onClick={onToggle} aria-pressed={participant.isSpectator} className={outlineButtonClass}>
      {label.text}
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
  const [copyStatus, setCopyStatus] = useState<keyof typeof COPY_LABELS>('idle')
  const [isEditingName, setIsEditingName] = useState(false)
  const [roomFull, setRoomFull] = useState(false)
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
      }
      socket.send(JSON.stringify(msg))
    })

    // A full room would turn every reconnect away too, so stop trying.
    socket.addEventListener('close', (e: CloseEvent) => {
      if (e.code === ROOM_FULL_CODE) {
        socket.close()
        setRoomFull(true)
      }
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

  async function copyLink() {
    try {
      // `navigator.clipboard` is missing on non-HTTPS pages, and writeText
      // rejects when the browser denies permission.
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus('idle'), 2000)
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground p-6 text-ink">
        <h1 className="font-mono text-2xl font-semibold">Join room</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="player-name" className="text-sm text-ink-muted">Your name</label>
            <input
              id="player-name"
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={24}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpectator}
              onChange={e => setIsSpectator(e.target.checked)}
              className="focus-ring h-4 w-4 accent-signal-ink"
            />
            <span className="text-ink-body">I&apos;m just observing</span>
          </label>
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className={primaryButtonClass}
          >
            enter room
          </button>
        </form>
      </main>
    )
  }

  if (roomFull) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ground p-6 text-ink">
        <p role="status" className="text-center text-ink-muted">This room is full. Try again later, or start a new room.</p>
      </main>
    )
  }

  if (!roomState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ground text-ink">
        <p role="status" className="text-ink-muted">Connecting…</p>
      </main>
    )
  }

  const myParticipant = roomState.participants[myId]
  const myVote = myParticipant?.vote ?? null
  const players = Object.values(roomState.participants).filter(p => !p.isSpectator)
  const votedCount = players.filter(p => p.vote !== null).length

  return (
    <main className="flex min-h-screen flex-col bg-ground text-ink">
      {/* Screen reader phase announcer */}
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {roomState.phase === 'voting' ? 'Voting in progress' : 'Cards revealed'}
      </p>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm font-semibold">
            planning-poker<span aria-hidden="true" className="text-signal-ink">_</span>
          </h1>
          <span className="font-mono text-sm text-ink-muted">{id}</span>
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
          <button onClick={copyLink} className={outlineButtonClass}>
            {COPY_LABELS[copyStatus]}
          </button>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {COPY_ANNOUNCEMENTS[copyStatus]}
          </div>
        </div>
      </header>

      {/* Mobile: participants strip */}
      <div className="md:hidden border-b border-line px-3">
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
        <aside className="hidden md:block w-56 shrink-0 p-6 border-r border-line overflow-y-auto">
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
