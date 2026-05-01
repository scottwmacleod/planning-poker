'use client'

import { Participant } from '../lib/types'

interface VoteResultsProps {
  participants: Record<string, Participant>
  onNewRound: () => void
}

export default function VoteResults({ participants, onNewRound }: VoteResultsProps) {
  const players = Object.values(participants).filter(p => !p.isSpectator && p.vote !== null)

  const votes = players.map(p => p.vote as string)
  const voteCounts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {players.map(p => {
          const outlier = isOutlier(p.vote!, votes)
          return (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div
                role="img"
                aria-label={outlier ? `${p.vote}, outlier` : String(p.vote)}
                className={`w-16 h-24 rounded-xl flex flex-col items-center justify-center text-xl font-bold border-2 ${
                  outlier ? 'bg-amber-900 border-amber-500 text-amber-200' : 'bg-indigo-900 border-indigo-600 text-white'
                }`}
              >
                <span aria-hidden="true">{p.vote}</span>
                {outlier && (
                  <span aria-hidden="true" className="text-xs mt-1 opacity-70">△</span>
                )}
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[64px] text-center">{p.name}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        {Object.keys(voteCounts).length > 0 && (
          <p className="text-gray-400 text-sm">
            {Object.entries(voteCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([v, c]) => `${v} ×${c}`)
              .join('  ·  ')}
          </p>
        )}
      </div>

      <button
        onClick={onNewRound}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      >
        New Round
      </button>
    </div>
  )
}

function isOutlier(vote: string, allVotes: string[]): boolean {
  const numeric = allVotes.map(Number).filter(n => !isNaN(n))
  if (numeric.length < 2) return false
  const v = Number(vote)
  if (isNaN(v)) return false
  const min = Math.min(...numeric)
  const max = Math.max(...numeric)
  return v === min || v === max
}
