'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import PartySocket from 'partysocket'
import CardDeck from '../../../components/CardDeck'
import ParticipantList from '../../../components/ParticipantList'
import VoteResults from '../../../components/VoteResults'
import Button from '../../../components/ui/Button'
import Checkbox from '../../../components/ui/Checkbox'
import Field from '../../../components/ui/Field'
import Input from '../../../components/ui/Input'
import { ROOM_FULL_CODE, type ClientMessage, type Participant, type RoomState, type ServerMessage } from '../../../lib/types'

// Read when connecting rather than at import, so tests can stub the env per case.
// Keep each variable as a literal `process.env.NEXT_PUBLIC_*` so Next can inline it.
// The old NEXT_PUBLIC_PARTYKIT_HOST is only a fallback until it is removed from Vercel.
function roomServerHost() {
  return process.env.NEXT_PUBLIC_ROOM_SERVER_HOST ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'
}


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
        <Input
          id="rename-input"
          ref={inputRef}
          autoFocus
          defaultValue={participant.name}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
          maxLength={24}
          size="sm"
          className="w-28"
        />
      </form>
    )
  }

  return (
    <Button onClick={onStartEdit}>
      {participant.name} <span aria-hidden="true">✎</span>
      <span className="sr-only">Edit your name</span>
    </Button>
  )
}

function SpectatorToggle({ participant, onToggle }: { participant: Participant; onToggle: () => void }) {
  const label = participant.isSpectator
    ? { text: 'observing', action: 'join voting' }
    : { text: 'playing', action: 'switch to observing' }

  return (
    <Button onClick={onToggle} aria-pressed={participant.isSpectator}>
      {label.text}
      <span className="sr-only"> — click to {label.action}</span>
    </Button>
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
      host: roomServerHost(),
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
        <h1 className="font-mono text-2xl font-semibold">join room</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-space-4 w-full max-w-sm">
          <Field
            id="player-name"
            label="your name"
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="e.g. Alice"
            maxLength={24}
          />
          <Checkbox
            label="i'm just observing"
            checked={isSpectator}
            onChange={e => setIsSpectator(e.target.checked)}
          />
          <Button type="submit" variant="signal" size="md" disabled={!nameInput.trim()} className="w-full">
            enter room
          </Button>
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
          <Button onClick={copyLink}>
            {COPY_LABELS[copyStatus]}
          </Button>
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
        <aside className="hidden md:block w-64 shrink-0 p-6 border-r border-line overflow-y-auto">
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
                <p aria-live="polite" className="font-mono text-ink-muted text-sm">
                  <span className="text-ink">{votedCount}</span> of {players.length} voted
                </p>
                {myParticipant?.isSpectator && (
                  <p className="font-mono text-ink-muted text-sm mt-1">Observing</p>
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

              <Button variant="signal" size="md" onClick={() => send({ type: 'reveal' })}>
                flip cards
              </Button>
            </>
          ) : (
            <VoteResults
              participants={roomState.participants}
              deck={roomState.deck}
              onNewRound={() => send({ type: 'newRound' })}
            />
          )}
        </section>
      </div>
    </main>
  )
}
