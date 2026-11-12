import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardDeck from './CardDeck'
import { DECKS } from '../lib/types'

const defaultProps = {
  deck: 'fibonacci' as const,
  selectedCard: null,
  onVote: vi.fn(),
  onChangeDeck: vi.fn(),
  disabled: false,
}

describe('CardDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('press feedback', () => {
    it('gives every card the shared press class', () => {
      render(<CardDeck {...defaultProps} />)
      DECKS.fibonacci.forEach(card => {
        expect(screen.getByRole('button', { name: String(card) })).toHaveClass('press')
      })
    })
  })

  describe('card rendering', () => {
    it('renders all fibonacci cards', () => {
      render(<CardDeck {...defaultProps} />)
      DECKS.fibonacci.forEach(card => {
        expect(screen.getByRole('button', { name: String(card) })).toBeInTheDocument()
      })
    })

    it('renders all tshirt cards', () => {
      render(<CardDeck {...defaultProps} deck="tshirt" />)
      DECKS.tshirt.forEach(card => {
        expect(screen.getByRole('button', { name: String(card) })).toBeInTheDocument()
      })
    })

    it('does not render tshirt cards when deck is fibonacci', () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />)
      expect(screen.queryByRole('button', { name: 'XS' })).not.toBeInTheDocument()
    })
  })

  describe('voting', () => {
    it('calls onVote with card value when clicked', async () => {
      render(<CardDeck {...defaultProps} />)
      await userEvent.click(screen.getByRole('button', { name: '5' }))
      expect(defaultProps.onVote).toHaveBeenCalledWith('5')
    })

    it('does not call onVote when disabled', async () => {
      render(<CardDeck {...defaultProps} disabled />)
      await userEvent.click(screen.getByRole('button', { name: '5' }))
      expect(defaultProps.onVote).not.toHaveBeenCalled()
    })

    it('selected card uses the signal tint and a signal-ink border', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      const card = screen.getByRole('button', { name: '5' })
      expect(card).toHaveAttribute('aria-pressed', 'true')
      expect(card).toHaveClass('bg-signal-tint', 'border-signal-ink')
    })

    it('unselected cards use the surface fill and control-line border', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      const card = screen.getByRole('button', { name: '3' })
      expect(card).toHaveAttribute('aria-pressed', 'false')
      expect(card).toHaveClass('bg-surface', 'border-control-line')
      expect(card).not.toHaveClass('bg-signal-tint')
    })

    it('no card selected when selectedCard is null', () => {
      render(<CardDeck {...defaultProps} selectedCard={null} />)
      DECKS.fibonacci.forEach(card => {
        expect(screen.getByRole('button', { name: String(card) })).toHaveAttribute('aria-pressed', 'false')
      })
      expect(screen.queryByText(/you voted/)).not.toBeInTheDocument()
    })

    it('marks the selected card with a + sign that is hidden from screen readers', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      const sign = screen.getByRole('button', { name: '5' }).querySelector('[aria-hidden="true"]')
      expect(sign).toHaveTextContent('+')
    })

    it('says which card you voted for below the deck', () => {
      render(<CardDeck {...defaultProps} selectedCard="8" />)
      expect(screen.getByText(/you voted 8/)).toHaveTextContent('+ you voted 8')
    })

    it('has no hover scaling or shadows', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      DECKS.fibonacci.forEach(card => {
        const cls = screen.getByRole('button', { name: String(card) }).className
        expect(cls).not.toMatch(/scale-|shadow/)
      })
    })
  })

  describe('keyboard navigation', () => {
    const card = (name: string) => screen.getByRole('button', { name })

    it('makes only one card a tab stop, starting at the first card', () => {
      render(<CardDeck {...defaultProps} />)
      expect(card('1')).toHaveAttribute('tabindex', '0')
      expect(card('3')).toHaveAttribute('tabindex', '-1')
    })

    it('makes the selected card the tab stop', () => {
      render(<CardDeck {...defaultProps} selectedCard="8" />)
      expect(card('8')).toHaveAttribute('tabindex', '0')
      expect(card('1')).toHaveAttribute('tabindex', '-1')
    })

    it('moves focus to the next card with the right arrow', async () => {
      render(<CardDeck {...defaultProps} />)
      card('1').focus()
      await userEvent.keyboard('{ArrowRight}')
      expect(card('3')).toHaveFocus()
      expect(card('3')).toHaveAttribute('tabindex', '0')
      expect(card('1')).toHaveAttribute('tabindex', '-1')
    })

    it('moves focus to the previous card with the left arrow', async () => {
      render(<CardDeck {...defaultProps} />)
      card('5').focus()
      await userEvent.keyboard('{ArrowLeft}')
      expect(card('3')).toHaveFocus()
    })

    it('treats the down and up arrows like right and left', async () => {
      render(<CardDeck {...defaultProps} />)
      card('1').focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(card('3')).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}')
      expect(card('1')).toHaveFocus()
    })

    it('wraps from the last card to the first and back', async () => {
      render(<CardDeck {...defaultProps} />)
      card('?').focus()
      await userEvent.keyboard('{ArrowRight}')
      expect(card('1')).toHaveFocus()
      await userEvent.keyboard('{ArrowLeft}')
      expect(card('?')).toHaveFocus()
    })

    it('jumps to the first and last cards with Home and End', async () => {
      render(<CardDeck {...defaultProps} />)
      card('5').focus()
      await userEvent.keyboard('{End}')
      expect(card('?')).toHaveFocus()
      await userEvent.keyboard('{Home}')
      expect(card('1')).toHaveFocus()
    })

    it('does not vote when moving focus', async () => {
      render(<CardDeck {...defaultProps} />)
      card('1').focus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}')
      expect(defaultProps.onVote).not.toHaveBeenCalled()
    })

    it('votes for the focused card with Enter and Space', async () => {
      render(<CardDeck {...defaultProps} />)
      card('1').focus()
      await userEvent.keyboard('{ArrowRight}{Enter}')
      expect(defaultProps.onVote).toHaveBeenLastCalledWith('3')
      await userEvent.keyboard('{ArrowRight} ')
      expect(defaultProps.onVote).toHaveBeenLastCalledWith('5')
    })
  })

  describe('deck switching', () => {
    it('calls onChangeDeck when fibonacci button clicked', async () => {
      render(<CardDeck {...defaultProps} deck="tshirt" />)
      await userEvent.click(screen.getByRole('button', { name: 'fibonacci' }))
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith('fibonacci')
    })

    it('calls onChangeDeck when t-shirt button clicked', async () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />)
      await userEvent.click(screen.getByRole('button', { name: 't-shirt' }))
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith('tshirt')
    })

    it('active deck button has active styles', () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />)
      expect(screen.getByRole('button', { name: 'fibonacci' })).toHaveClass('bg-surface', 'text-ink')
      expect(screen.getByRole('button', { name: 't-shirt' })).not.toHaveClass('bg-surface')
    })
  })
})
