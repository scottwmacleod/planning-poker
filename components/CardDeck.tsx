'use client'

import { KeyboardEvent, useRef, useState } from 'react'
import { DECKS, Deck } from '../lib/types'

interface CardDeckProps {
  deck: Deck
  selectedCard: string | null
  onVote: (value: string) => void
  onChangeDeck: (deck: Deck) => void
  disabled: boolean
}

const DECK_BUTTONS: { deck: Deck; label: string }[] = [
  { deck: 'fibonacci', label: 'fibonacci' },
  { deck: 'tshirt', label: 't-shirt' },
]

export default function CardDeck({ deck, selectedCard, onVote, onChangeDeck, disabled }: CardDeckProps) {
  const cards = DECKS[deck]
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // One tab stop for the whole row: the focused card, else the selected card, else the first.
  const selectedIndex = cards.findIndex(card => String(card) === selectedCard)
  const tabStop = focusedIndex !== null && focusedIndex < cards.length
    ? focusedIndex
    : Math.max(selectedIndex, 0)

  function moveFocus(e: KeyboardEvent<HTMLButtonElement>, from: number) {
    const last = cards.length - 1
    const target =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (from === last ? 0 : from + 1)
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (from === 0 ? last : from - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (target === null) return
    e.preventDefault()
    setFocusedIndex(target)
    cardRefs.current[target]?.focus()
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      <div role="group" aria-label="Card deck" className="flex font-mono text-sm">
        {DECK_BUTTONS.map(({ deck: d, label }, i) => (
          <button
            key={d}
            onClick={() => onChangeDeck(d)}
            aria-pressed={deck === d}
            className={`focus-ring px-4 py-1.5 border border-line touch-manipulation ${i > 0 ? '-ml-px' : ''} ${
              deck === d ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
        {cards.map((card, i) => {
          const val = String(card)
          const isSelected = selectedCard === val
          return (
            <button
              key={val}
              ref={el => { cardRefs.current[i] = el }}
              tabIndex={i === tabStop ? 0 : -1}
              onKeyDown={e => moveFocus(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onClick={() => !disabled && onVote(val)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`focus-ring press relative w-12 h-[4.5rem] sm:w-16 sm:h-24 rounded-1 font-mono font-semibold tabular-nums text-lg sm:text-[22px] select-none touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-signal-tint border-2 border-signal-ink text-signal-ink'
                  : 'bg-surface border border-control-line text-ink hover:border-ink'
              }`}
            >
              {isSelected && (
                <span aria-hidden="true" className="absolute top-1 left-1.5 text-xs leading-none">+</span>
              )}
              {val}
            </button>
          )
        })}
      </div>

      {selectedCard !== null && (
        <p className="font-mono text-sm text-ink-muted">
          <span aria-hidden="true" className="text-signal-ink">+ </span>
          you voted {selectedCard}
        </p>
      )}
    </div>
  )
}
