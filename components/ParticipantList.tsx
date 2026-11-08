'use client'

import type { ReactNode } from 'react'
import { Participant, Phase } from '../lib/types'

interface ParticipantListProps {
  participants: Record<string, Participant>
  phase: Phase
  myId: string
  compact?: boolean
}

type Status = 'voted' | 'thinking' | 'observing' | 'no-vote'

const SIGN: Record<Status, { sign: string; classes: string }> = {
  voted: { sign: '+', classes: 'text-signal-ink bg-signal-tint' },
  thinking: { sign: '~', classes: 'text-wip bg-wip-tint' },
  observing: { sign: '·', classes: 'text-ink-muted' },
  'no-vote': { sign: '−', classes: 'text-removed' },
}

function statusOf(p: Participant, phase: Phase): Status {
  if (p.isSpectator) return 'observing'
  if (p.vote !== null) return 'voted'
  return phase === 'revealed' ? 'no-vote' : 'thinking'
}

function srText(status: Status): string {
  switch (status) {
    case 'observing': return 'observing'
    case 'no-vote': return 'did not vote'
    case 'thinking': return 'still thinking'
    case 'voted': return 'voted'
  }
}

export default function ParticipantList({ participants, phase, myId, compact }: ParticipantListProps) {
  const list = Object.values(participants)

  if (compact) {
    return (
      <ul className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide font-mono">
        {list.map(p => {
          const status = statusOf(p, phase)
          return (
            <li
              key={p.id}
              className="flex items-center gap-1.5 border border-line px-3 py-1 shrink-0 text-xs"
            >
              <Sign status={status} />
              <span className={`whitespace-nowrap max-w-[80px] truncate ${status === 'observing' ? 'text-ink-muted' : 'text-ink'}`}>
                {p.name}
              </span>
              {p.id === myId && <span className="text-ink-muted">you</span>}
              <StatusText p={p} status={status} phase={phase} />
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs font-mono">
      <h2 className="text-xs text-ink-muted">participants ({list.length})</h2>
      <ul className="border border-line divide-y divide-line">
        {list.map(p => {
          const status = statusOf(p, phase)
          return (
            <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="flex flex-col min-w-0">
                <span className="flex items-center gap-2 min-w-0">
                  <Sign status={status} />
                  <span title={p.name} className={`truncate ${status === 'observing' ? 'text-ink-muted' : 'text-ink'}`}>
                    {p.name}
                  </span>
                  {p.id === myId && <span className="text-ink-muted text-xs shrink-0">you</span>}
                </span>
                {status === 'observing' && <ObservingTag className="pl-7" />}
              </div>
              {status !== 'observing' && <StatusText p={p} status={status} phase={phase} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ObservingTag({ className = '' }: { className?: string }) {
  return <span className={`text-xs text-ink-muted ${className}`}>observing</span>
}

function Sign({ status }: { status: Status }) {
  return <span aria-hidden="true" className={`w-5 h-5 inline-flex items-center justify-center shrink-0 ${SIGN[status].classes}`}>{SIGN[status].sign}</span>
}

// Right-hand side of a row: visible text where the design has some, plus
// screen-reader text for every state.
function StatusText({ p, status, phase }: { p: Participant; status: Status; phase: Phase }): ReactNode {
  if (status === 'observing') {
    return <ObservingTag />
  }
  if (phase === 'revealed') {
    if (status === 'no-vote') {
      return (
        <>
          <span className="text-xs text-ink-muted">no vote</span>
          <span className="sr-only">did not vote</span>
        </>
      )
    }
    return (
      <>
        <span aria-hidden="true" className="font-semibold text-ink">{p.vote}</span>
        <span className="sr-only">voted {p.vote}</span>
      </>
    )
  }
  return <span className="sr-only">{srText(status)}</span>
}
