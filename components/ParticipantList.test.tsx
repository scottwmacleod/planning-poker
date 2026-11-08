import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ParticipantList from './ParticipantList'
import type { Participant } from '../lib/types'

function player(id: string, vote: string | null = null): Participant {
  return { id, name: `Player ${id}`, isSpectator: false, vote }
}

function spectator(id: string): Participant {
  return { id, name: `Spectator ${id}`, isSpectator: true, vote: null }
}

function row(name: string) {
  return screen.getByText(name).closest('li')!
}

describe('ParticipantList', () => {
  describe('full mode', () => {
    it('renders all participants', () => {
      render(<ParticipantList participants={{ a: player('a'), b: player('b') }} phase="voting" myId="x" />)
      expect(screen.getByText('Player a')).toBeInTheDocument()
      expect(screen.getByText('Player b')).toBeInTheDocument()
    })

    it('shows participant count in the label', () => {
      render(<ParticipantList participants={{ a: player('a'), b: player('b') }} phase="voting" myId="x" />)
      expect(screen.getByText(/participants \(2\)/i)).toBeInTheDocument()
    })

    it('shows a muted "you" after your own name only', () => {
      render(<ParticipantList participants={{ a: player('a'), b: player('b') }} phase="voting" myId="a" />)
      expect(screen.getAllByText('you')).toHaveLength(1)
      expect(within(row('Player a')).getByText('you')).toBeInTheDocument()
    })
  })

  describe('status signs', () => {
    it('voted shows + with "voted" for screen readers', () => {
      render(<ParticipantList participants={{ a: player('a', '5') }} phase="voting" myId="x" />)
      const r = row('Player a')
      expect(within(r).getByText('+')).toHaveAttribute('aria-hidden', 'true')
      expect(r).toHaveTextContent('voted')
      expect(within(r).getByText('voted')).toHaveClass('sr-only')
      expect(within(r).getByText('+')).toHaveClass('bg-signal-tint', 'text-signal-ink')
    })

    it('still thinking shows ~ with text for screen readers', () => {
      render(<ParticipantList participants={{ a: player('a') }} phase="voting" myId="x" />)
      const r = row('Player a')
      expect(within(r).getByText('~')).toHaveAttribute('aria-hidden', 'true')
      expect(within(r).getByText('still thinking')).toHaveClass('sr-only')
      expect(within(r).getByText('~')).toHaveClass('bg-wip-tint', 'text-wip')
    })

    it('observer shows · and "observing" instead of the eye emoji', () => {
      const { container } = render(
        <ParticipantList participants={{ s: spectator('s') }} phase="voting" myId="x" />
      )
      const r = row('Spectator s')
      expect(within(r).getByText('·')).toHaveAttribute('aria-hidden', 'true')
      expect(within(r).getByText('observing')).toBeInTheDocument()
      expect(container).not.toHaveTextContent('👁')
    })

    it('voted card values stay hidden while voting', () => {
      render(<ParticipantList participants={{ a: player('a', '8') }} phase="voting" myId="x" />)
      expect(screen.queryByText('8')).not.toBeInTheDocument()
    })
  })

  describe('after reveal', () => {
    it('shows the vote on the right with "voted 8" for screen readers', () => {
      render(<ParticipantList participants={{ a: player('a', '8') }} phase="revealed" myId="x" />)
      const r = row('Player a')
      expect(within(r).getByText('8')).toBeInTheDocument()
      expect(r).toHaveTextContent('voted 8')
    })

    it('shows − and "no vote" for a player who did not vote', () => {
      render(<ParticipantList participants={{ a: player('a', null) }} phase="revealed" myId="x" />)
      const r = row('Player a')
      expect(within(r).getByText('−')).toHaveAttribute('aria-hidden', 'true')
      expect(within(r).getByText('no vote')).toBeInTheDocument()
      expect(within(r).getByText('did not vote')).toHaveClass('sr-only')
    })

    it('observers still read as observing', () => {
      render(<ParticipantList participants={{ s: spectator('s') }} phase="revealed" myId="x" />)
      expect(within(row('Spectator s')).getByText('observing')).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('renders participants as chips with the same signs', () => {
      render(
        <ParticipantList
          participants={{ a: player('a', '5'), b: player('b'), s: spectator('s') }}
          phase="voting"
          myId="x"
          compact
        />
      )
      expect(within(row('Player a')).getByText('+')).toBeInTheDocument()
      expect(within(row('Player a')).getByText('voted')).toBeInTheDocument()
      expect(within(row('Player b')).getByText('~')).toBeInTheDocument()
      expect(within(row('Player b')).getByText('still thinking')).toBeInTheDocument()
      expect(within(row('Spectator s')).getByText('·')).toBeInTheDocument()
      expect(within(row('Spectator s')).getByText('observing')).toBeInTheDocument()
    })

    it('does not render the participants label', () => {
      render(<ParticipantList participants={{ a: player('a') }} phase="voting" myId="x" compact />)
      expect(screen.queryByText(/participants/i)).not.toBeInTheDocument()
    })

    it('marks yourself with "you"', () => {
      render(<ParticipantList participants={{ a: player('a') }} phase="voting" myId="a" compact />)
      expect(screen.getByText('you')).toBeInTheDocument()
    })
  })
})
