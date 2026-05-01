import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParticipantList from './ParticipantList'
import type { Participant } from '../lib/types'

function player(id: string, vote: string | null = null): Participant {
  return { id, name: `Player ${id}`, isSpectator: false, vote }
}

function spectator(id: string): Participant {
  return { id, name: `Spectator ${id}`, isSpectator: true, vote: null }
}

describe('ParticipantList', () => {
  describe('full mode', () => {
    it('renders all participants', () => {
      const participants = {
        a: player('a'),
        b: player('b'),
      }
      render(<ParticipantList participants={participants} phase="voting" myId="x" />)
      expect(screen.getByText('Player a')).toBeInTheDocument()
      expect(screen.getByText('Player b')).toBeInTheDocument()
    })

    it('shows participant count in heading', () => {
      const participants = { a: player('a'), b: player('b') }
      render(<ParticipantList participants={participants} phase="voting" myId="x" />)
      expect(screen.getByText(/participants \(2\)/i)).toBeInTheDocument()
    })

    it('shows (you) label for myId', () => {
      const participants = { a: player('a') }
      render(<ParticipantList participants={participants} phase="voting" myId="a" />)
      expect(screen.getByText(/(you)/)).toBeInTheDocument()
    })

    it('does not show (you) for other participants', () => {
      const participants = { a: player('a'), b: player('b') }
      render(<ParticipantList participants={participants} phase="voting" myId="a" />)
      const youLabels = screen.getAllByText(/(you)/)
      expect(youLabels).toHaveLength(1)
    })

    it('shows spectator eye emoji', () => {
      const participants = { s: spectator('s') }
      render(<ParticipantList participants={participants} phase="voting" myId="x" />)
      expect(screen.getByText(/👁/)).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('renders participant names as chips', () => {
      const participants = { a: player('a'), b: player('b') }
      render(<ParticipantList participants={participants} phase="voting" myId="x" compact />)
      expect(screen.getByText(/Player a/)).toBeInTheDocument()
      expect(screen.getByText(/Player b/)).toBeInTheDocument()
    })

    it('does not render participants heading', () => {
      const participants = { a: player('a') }
      render(<ParticipantList participants={participants} phase="voting" myId="x" compact />)
      expect(screen.queryByText(/participants/i)).not.toBeInTheDocument()
    })
  })

  describe('VoteIndicator', () => {
    it('renders no indicator for spectators', () => {
      const participants = { s: spectator('s') }
      const { container } = render(
        <ParticipantList participants={participants} phase="voting" myId="x" />
      )
      expect(container.querySelector('.rounded-full.bg-green-500')).not.toBeInTheDocument()
      expect(container.querySelector('.rounded-full.bg-gray-600')).not.toBeInTheDocument()
    })

    it('shows green dot when player has voted in voting phase', () => {
      const participants = { a: player('a', '5') }
      const { container } = render(
        <ParticipantList participants={participants} phase="voting" myId="x" />
      )
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
    })

    it('shows gray dot when player has not voted in voting phase', () => {
      const participants = { a: player('a', null) }
      const { container } = render(
        <ParticipantList participants={participants} phase="voting" myId="x" />
      )
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument()
    })

    it('shows vote value in revealed phase', () => {
      const participants = { a: player('a', '8') }
      render(<ParticipantList participants={participants} phase="revealed" myId="x" />)
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('shows dash for player without vote in revealed phase', () => {
      const participants = { a: player('a', null) }
      render(<ParticipantList participants={participants} phase="revealed" myId="x" />)
      expect(screen.getByText('–')).toBeInTheDocument()
    })

    it('hides dots in revealed phase', () => {
      const participants = { a: player('a', '5') }
      const { container } = render(
        <ParticipantList participants={participants} phase="revealed" myId="x" />
      )
      expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument()
      expect(container.querySelector('.bg-gray-600')).not.toBeInTheDocument()
    })
  })
})
