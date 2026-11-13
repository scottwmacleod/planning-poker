import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Field from './Field'

describe('Field', () => {
  it('labels its input in the lowercase mono voice', () => {
    render(<Field id="room-id" label="room id" placeholder="e.g. abc12345" />)
    const input = screen.getByLabelText('room id')
    expect(input).toHaveAttribute('id', 'room-id')
    expect(input).toHaveAttribute('placeholder', 'e.g. abc12345')
    expect(screen.getByText('room id')).toHaveClass('font-mono', 'text-ink-muted')
  })

  it('uses the shared input style', () => {
    render(<Field id="player-name" label="your name" />)
    expect(screen.getByLabelText('your name')).toHaveClass('rounded-1', 'border-control-line', 'focus-ring')
  })
})
