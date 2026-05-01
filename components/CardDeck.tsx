'use client'

import { DECKS, Deck } from '../lib/types'

interface CardDeckProps {
  deck: Deck
  selectedCard: string | null
  onVote: (value: string) => void
  onChangeDeck: (deck: Deck) => void
  disabled: boolean
}

export default function CardDeck({ deck, selectedCard, onVote, onChangeDeck, disabled }: CardDeckProps) {
  const cards = DECKS[deck]

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      <div role="group" aria-label="Card deck" className="flex gap-2">
        {(['fibonacci', 'tshirt'] as Deck[]).map(d => (
          <button
            key={d}
            onClick={() => onChangeDeck(d)}
            aria-pressed={deck === d}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
              deck === d
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {d === 'fibonacci' ? 'Fibonacci' : 'T-Shirt'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
        {cards.map(card => {
          const val = String(card)
          const isSelected = selectedCard === val
          return (
            <button
              key={val}
              onClick={() => !disabled && onVote(val)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`w-12 h-[4.5rem] sm:w-16 sm:h-24 rounded-xl text-base sm:text-xl font-bold border-2 transition-all select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow-lg shadow-indigo-900'
                  : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-500 hover:scale-105'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100`}
            >
              {val}
            </button>
          )
        })}
      </div>
    </div>
  )
}
