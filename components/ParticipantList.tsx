'use client'

import { Participant, Phase } from '../lib/types'

interface ParticipantListProps {
  participants: Record<string, Participant>
  phase: Phase
  myId: string
  compact?: boolean
}

export default function ParticipantList({ participants, phase, myId, compact }: ParticipantListProps) {
  const list = Object.values(participants)

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
        {list.map(p => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 bg-gray-900 rounded-full px-3 py-1.5 shrink-0"
          >
            <VoteIndicator participant={p} phase={phase} />
            <span className="text-xs font-medium whitespace-nowrap max-w-[80px] truncate">
              {p.name}
              {p.isSpectator && <span className="text-gray-500 ml-1">👁</span>}
              {p.id === myId && <span className="text-gray-500 ml-1">·you</span>}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Participants ({list.length})
      </h2>
      {list.map(p => (
        <div
          key={p.id}
          className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2"
        >
          <span className="text-sm font-medium truncate max-w-[140px]">
            {p.name}
            {p.id === myId && <span className="text-gray-500 ml-1">(you)</span>}
            {p.isSpectator && <span className="text-gray-500 ml-1">👁</span>}
          </span>
          <VoteIndicator participant={p} phase={phase} />
        </div>
      ))}
    </div>
  )
}

function VoteIndicator({ participant, phase }: { participant: Participant; phase: Phase }) {
  if (participant.isSpectator) return null

  if (phase === 'revealed') {
    return (
      <span className="text-sm font-bold text-indigo-400 min-w-[32px] text-right">
        {participant.vote ?? '–'}
      </span>
    )
  }

  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${participant.vote !== null ? 'bg-green-500' : 'bg-gray-600'}`} />
  )
}
