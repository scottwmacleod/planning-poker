import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoteResults from './VoteResults'
import type { Participant } from '../lib/types'

function player(id: string, vote: string | null, name = `Player ${id}`): Participant {
  return { id, name, isSpectator: false, vote }
}

function spectator(id: string): Participant {
  return { id, name: `Spectator ${id}`, isSpectator: true, vote: null }
}

function renderResults(participants: Record<string, Participant>, extra: { deck?: 'fibonacci' | 'tshirt'; onNewRound?: () => void } = {}) {
  return render(
    <VoteResults
      participants={participants}
      deck={extra.deck ?? 'fibonacci'}
      onNewRound={extra.onNewRound ?? (() => {})}
    />
  )
}

const cards = () => screen.getAllByRole('img')

describe('VoteResults motion', () => {
  it('grows each distribution bar after the dealt cards, and presses new round', () => {
    const { container } = renderResults({ a: player('a', '5'), b: player('b', '8'), c: player('c', '5') })
    const bars = container.querySelectorAll('li .bar-grow')
    expect(bars).toHaveLength(2)
    // two cards dealt 80ms apart settle first: bars start after the last of 3 cards
    expect((bars[0] as HTMLElement).style.getPropertyValue('--n')).toBe('3')
    expect((bars[1] as HTMLElement).style.getPropertyValue('--n')).toBe('4')
    expect(screen.getByRole('button', { name: 'new round' })).toHaveClass('press')
  })
})

describe('VoteResults', () => {
  describe('face-up cards', () => {
    it('renders one card per voter with a name under it', () => {
      renderResults({ a: player('a', '5', 'Dev'), b: player('b', '5', 'QA') })
      expect(screen.getByRole('img', { name: 'Dev: 5' })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'QA: 5' })).toBeInTheDocument()
      expect(screen.getByText('Dev')).toHaveClass('text-ink-muted')
    })

    it('sorts cards low to high in deck order', () => {
      renderResults({ a: player('a', '13'), b: player('b', '3'), c: player('c', '?'), d: player('d', '5') })
      expect(cards().map(c => c.getAttribute('aria-label'))).toEqual([
        'Player b: 3, outlier low',
        'Player d: 5',
        'Player a: 13, outlier high',
        'Player c: ?',
      ])
    })

    it('sorts t-shirt sizes in deck order', () => {
      renderResults({ a: player('a', 'XL'), b: player('b', 'S'), c: player('c', 'M') }, { deck: 'tshirt' })
      expect(cards().map(c => c.getAttribute('aria-label'))).toEqual(['Player b: S', 'Player c: M', 'Player a: XL'])
    })

    it('excludes spectators', () => {
      renderResults({ a: player('a', '5'), s: spectator('s') })
      expect(screen.queryByText('Spectator s')).not.toBeInTheDocument()
    })

    it('shows a dashed − card for players who did not vote', () => {
      renderResults({ a: player('a', '5'), b: player('b', null, 'Ops') })
      const card = screen.getByRole('img', { name: 'Ops: no vote' })
      expect(card).toHaveClass('border-dashed')
      expect(card).toHaveTextContent('−')
      expect(screen.getByText('Ops')).toBeInTheDocument()
    })

    it('cards are staggered 80ms apart', () => {
      renderResults({ a: player('a', '3'), b: player('b', '5'), c: player('c', '8') })
      expect(cards().map(c => c.style.getPropertyValue('--i'))).toEqual(['0', '1', '2'])
      cards().forEach(c => expect(c).toHaveClass('deal-in'))
    })
  })

  describe('outliers', () => {
    it('marks min and max with amber styling, a label and an accessible name', () => {
      renderResults({ a: player('a', '3', 'Dev'), b: player('b', '5', 'QA'), c: player('c', '13', 'Ops') })

      const low = screen.getByRole('img', { name: 'Dev: 3, outlier low' })
      const mid = screen.getByRole('img', { name: 'QA: 5' })
      const high = screen.getByRole('img', { name: 'Ops: 13, outlier high' })

      expect(low).toHaveClass('border-wip', 'bg-wip-tint', 'text-wip')
      expect(high).toHaveClass('border-wip', 'bg-wip-tint', 'text-wip')
      expect(mid).not.toHaveClass('border-wip')

      expect(screen.getByText('↓ low')).toBeInTheDocument()
      expect(screen.getByText('↑ high')).toBeInTheDocument()
    })

    it('does not mark non-numeric votes as outliers', () => {
      renderResults({ a: player('a', '3'), b: player('b', '8'), c: player('c', '?') })
      expect(screen.getByRole('img', { name: 'Player c: ?' })).not.toHaveClass('border-wip')
    })

    it('no outliers when fewer than two numeric votes', () => {
      renderResults({ a: player('a', '5') })
      expect(screen.getByRole('img', { name: 'Player a: 5' })).not.toHaveClass('border-wip')
      expect(screen.queryByText(/outlier|↑|↓/)).not.toBeInTheDocument()
    })

    it('no outliers when every numeric vote is the same', () => {
      renderResults({ a: player('a', '5'), b: player('b', '5') })
      cards().forEach(card => expect(card).not.toHaveClass('border-wip'))
      expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument()
    })

    it('no outliers when all non-numeric', () => {
      renderResults({ a: player('a', '?'), b: player('b', '?') })
      cards().forEach(card => expect(card).not.toHaveClass('border-wip'))
    })
  })

  describe('summary', () => {
    it('draws one bar row per value with ×n counts and highlights the single most common', () => {
      renderResults({ a: player('a', '5'), b: player('b', '5'), c: player('c', '8') })
      const five = screen.getByText('×2').closest('li')!
      const eight = screen.getByText('×1').closest('li')!
      expect(five).toHaveTextContent('5')
      expect(eight).toHaveTextContent('8')
      expect(five.querySelector('.bg-signal-ink')).toBeInTheDocument()
      expect(eight.querySelector('.bg-signal-ink')).not.toBeInTheDocument()
      expect(eight.querySelector('.bg-ink-muted')).toBeInTheDocument()
    })

    it('reports most common, range and turnout', () => {
      renderResults({
        a: player('a', '3'), b: player('b', '5'), c: player('c', '5'), d: player('d', '13'), e: player('e', null),
      })
      expect(screen.getByText(/most common/)).toHaveTextContent('most common 5 · range 3–13 · 4 of 5 voted')
    })

    it('reads ties as "tied 5 / 8"', () => {
      renderResults({ a: player('a', '5'), b: player('b', '8') })
      expect(screen.getByText(/tied/)).toHaveTextContent('tied 5 / 8 · range 5–8 · 2 of 2 voted')
    })

    it('ranges t-shirt sizes by deck order', () => {
      renderResults({ a: player('a', 'XL'), b: player('b', 'S') }, { deck: 'tshirt' })
      expect(screen.getByText(/range/)).toHaveTextContent('range S–XL')
    })

    it('leaves out most common and range when nobody voted', () => {
      renderResults({ a: player('a', null) })
      expect(screen.getByText(/0 of 1 voted/)).not.toHaveTextContent(/most common|range|tied/)
    })
  })

  it('calls onNewRound from the lime new round button', async () => {
    const onNewRound = vi.fn()
    renderResults({ a: player('a', '5') }, { onNewRound })
    const button = screen.getByRole('button', { name: 'new round' })
    expect(button).toHaveClass('bg-signal', 'text-on-signal')
    await userEvent.click(button)
    expect(onNewRound).toHaveBeenCalledOnce()
  })
})
