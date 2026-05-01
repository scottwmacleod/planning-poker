import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoteResults from './VoteResults'
import type { Participant } from '../lib/types'

function player(id: string, vote: string | null): Participant {
  return { id, name: `Player ${id}`, isSpectator: false, vote }
}

function spectator(id: string): Participant {
  return { id, name: `Spectator ${id}`, isSpectator: true, vote: null }
}

describe('VoteResults', () => {
  describe('rendering', () => {
    it('renders voted players', () => {
      const participants = {
        a: player('a', '5'),
        b: player('b', '8'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('renders player names', () => {
      const participants = { a: player('a', '5') }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)
      expect(screen.getByText('Player a')).toBeInTheDocument()
    })

    it('excludes spectators', () => {
      const participants = {
        a: player('a', '5'),
        s: spectator('s'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)
      expect(screen.queryByText('Spectator s')).not.toBeInTheDocument()
    })

    it('excludes players who have not voted', () => {
      const participants = {
        a: player('a', '5'),
        b: player('b', null),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)
      expect(screen.queryByText('Player b')).not.toBeInTheDocument()
    })

    it('shows vote count summary', () => {
      const participants = {
        a: player('a', '5'),
        b: player('b', '5'),
        c: player('c', '8'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)
      expect(screen.getByText(/5 ×2/)).toBeInTheDocument()
      expect(screen.getByText(/8 ×1/)).toBeInTheDocument()
    })

    it('calls onNewRound when button clicked', async () => {
      const onNewRound = vi.fn()
      const participants = { a: player('a', '5') }
      render(<VoteResults participants={participants} onNewRound={onNewRound} />)
      await userEvent.click(screen.getByRole('button', { name: /new round/i }))
      expect(onNewRound).toHaveBeenCalledOnce()
    })
  })

  describe('outlier detection', () => {
    it('marks min and max as outliers with amber style', () => {
      const participants = {
        a: player('a', '3'),
        b: player('b', '5'),
        c: player('c', '8'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)

      const card3 = screen.getByText('3').closest('div')!
      const card5 = screen.getByText('5').closest('div')!
      const card8 = screen.getByText('8').closest('div')!

      expect(card3).toHaveClass('bg-amber-900')
      expect(card5).not.toHaveClass('bg-amber-900')
      expect(card8).toHaveClass('bg-amber-900')
    })

    it('does not mark non-numeric votes as outliers', () => {
      const participants = {
        a: player('a', '3'),
        b: player('b', '8'),
        c: player('c', '?'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)

      const cardQ = screen.getByText('?').closest('div')!
      expect(cardQ).not.toHaveClass('bg-amber-900')
    })

    it('no outliers when fewer than two numeric votes', () => {
      const participants = { a: player('a', '5') }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)

      const card5 = screen.getByText('5').closest('div')!
      expect(card5).not.toHaveClass('bg-amber-900')
    })

    it('no outliers when all non-numeric', () => {
      const participants = {
        a: player('a', '?'),
        b: player('b', '?'),
      }
      render(<VoteResults participants={participants} onNewRound={() => {}} />)

      const cards = screen.getAllByText('?').map(el => el.closest('div')!)
      cards.forEach(card => expect(card).not.toHaveClass('bg-amber-900'))
    })
  })
})
