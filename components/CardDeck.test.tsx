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

    it('selected card has selected styles', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      const card = screen.getByRole('button', { name: '5' })
      expect(card).toHaveClass('bg-indigo-600')
    })

    it('unselected cards do not have selected styles', () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />)
      const card = screen.getByRole('button', { name: '3' })
      expect(card).not.toHaveClass('bg-indigo-600')
    })

    it('no card selected when selectedCard is null', () => {
      render(<CardDeck {...defaultProps} selectedCard={null} />)
      DECKS.fibonacci.forEach(card => {
        expect(screen.getByRole('button', { name: String(card) })).not.toHaveClass('bg-indigo-600')
      })
    })
  })

  describe('deck switching', () => {
    it('calls onChangeDeck when fibonacci button clicked', async () => {
      render(<CardDeck {...defaultProps} deck="tshirt" />)
      await userEvent.click(screen.getByRole('button', { name: /fibonacci/i }))
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith('fibonacci')
    })

    it('calls onChangeDeck when t-shirt button clicked', async () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />)
      await userEvent.click(screen.getByRole('button', { name: /t-shirt/i }))
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith('tshirt')
    })

    it('active deck button has active styles', () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />)
      expect(screen.getByRole('button', { name: /fibonacci/i })).toHaveClass('bg-indigo-600')
      expect(screen.getByRole('button', { name: /t-shirt/i })).not.toHaveClass('bg-indigo-600')
    })
  })
})
