'use client'

import { DECKS, Deck, Participant } from '../lib/types'

interface VoteResultsProps {
  participants: Record<string, Participant>
  deck: Deck
  onNewRound: () => void
}

export default function VoteResults({ participants, deck, onNewRound }: VoteResultsProps) {
  const order = DECKS[deck].map(String)
  const rank = (v: string) => {
    const i = order.indexOf(v)
    return i === -1 ? order.length : i
  }

  const players = Object.values(participants)
    .filter(p => !p.isSpectator)
    .sort((a, b) => {
      // Non-voters go last; everyone else is low to high in deck order.
      if ((a.vote === null) !== (b.vote === null)) return a.vote === null ? 1 : -1
      return a.vote === null ? 0 : rank(a.vote) - rank(b.vote!)
    })

  const votes = players.flatMap(p => (p.vote === null ? [] : [p.vote]))
  const counts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  const distribution = Object.entries(counts).sort((a, b) => rank(a[0]) - rank(b[0]))
  const top = Math.max(0, ...Object.values(counts))
  const mostCommon = distribution.filter(([, c]) => c === top).map(([v]) => v)

  const winner = mostCommon.length === 1 ? mostCommon[0] : null

  const ranked = votes.filter(v => rank(v) < order.length && v !== '?').sort((a, b) => rank(a) - rank(b))
  const range = ranked.length > 0 ? `${ranked[0]}–${ranked[ranked.length - 1]}` : null

  const facts = [
    winner ? `most common ${winner}` : mostCommon.length > 1 ? `tied ${mostCommon.join(' / ')}` : null,
    range && `range ${range}`,
    `${votes.length} of ${players.length} voted`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col items-center gap-6 font-mono">
      <div className="flex flex-wrap justify-center gap-3">
        {players.map((p, i) => {
          const direction = p.vote === null ? null : outlierDirection(p.vote, votes)
          const label =
            p.vote === null ? `${p.name}: no vote`
            : direction ? `${p.name}: ${p.vote}, outlier ${direction}`
            : `${p.name}: ${p.vote}`
          const face =
            p.vote === null ? 'border border-dashed border-control-line text-ink-muted'
            : direction ? 'border-2 border-wip bg-wip-tint text-wip'
            : 'border border-control-line bg-surface text-ink'
          return (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div
                role="img"
                aria-label={label}
                style={{ '--i': i } as React.CSSProperties}
                className={`deal-in w-16 h-24 rounded-1 flex items-center justify-center text-[22px] font-semibold tabular-nums ${face}`}
              >
                <span aria-hidden="true">{p.vote ?? '−'}</span>
              </div>
              {direction && (
                <span className="text-xs text-wip">{direction === 'high' ? '↑ high' : '↓ low'}</span>
              )}
              <span className="text-xs text-ink-muted truncate max-w-[64px] text-center">{p.name}</span>
            </div>
          )
        })}
      </div>

      {distribution.length > 0 && (
        <ul className="flex flex-col gap-1 w-full max-w-xs text-sm">
          {distribution.map(([v, c]) => {
            const isWinner = v === winner
            return (
            <li key={v} className="flex items-center gap-3">
              <span className="w-8 text-right text-ink">{v}</span>
              <span aria-hidden="true" className="flex-1 h-2 bg-line">
                <span
                  className={`block h-full ${isWinner ? 'bg-signal-ink' : 'bg-ink-muted'}`}
                  style={{ width: `${(c / top) * 100}%` }}
                />
              </span>
              <span className={`w-8 ${isWinner ? 'text-signal-ink' : 'text-ink-muted'}`}>×{c}</span>
            </li>
            )
          })}
        </ul>
      )}

      <p className="text-sm text-ink-muted">{facts}</p>

      <button
        onClick={onNewRound}
        className="focus-ring px-8 py-3 bg-signal text-on-signal rounded-1 font-mono font-semibold touch-manipulation"
      >
        new round
      </button>
    </div>
  )
}

function outlierDirection(vote: string, allVotes: string[]): 'high' | 'low' | null {
  const numeric = allVotes.map(Number).filter(n => !isNaN(n))
  if (numeric.length < 2) return null
  const v = Number(vote)
  if (isNaN(v)) return null
  const min = Math.min(...numeric)
  const max = Math.max(...numeric)
  if (min === max) return null
  return v === max ? 'high' : v === min ? 'low' : null
}
