import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>copy link</Button>)
    expect(screen.getByRole('button', { name: 'copy link' })).toHaveAttribute('type', 'button')
  })

  it('can submit a form when asked', () => {
    render(<Button type="submit">enter room</Button>)
    expect(screen.getByRole('button', { name: 'enter room' })).toHaveAttribute('type', 'submit')
  })

  it('has the brand corners, focus ring and mono type in every variant', () => {
    render(
      <>
        <Button variant="signal">a</Button>
        <Button variant="outline">b</Button>
      </>,
    )
    for (const name of ['a', 'b']) {
      expect(screen.getByRole('button', { name })).toHaveClass('rounded-1', 'focus-ring', 'font-mono')
    }
  })

  it('signal buttons are lime, press down and go quiet when disabled', () => {
    render(<Button variant="signal" disabled>join room</Button>)
    const btn = screen.getByRole('button', { name: 'join room' })
    expect(btn).toHaveClass('bg-signal', 'text-on-signal', 'press', 'enabled:hover:bg-signal-ink')
    expect(btn).toHaveClass('disabled:bg-transparent', 'disabled:text-ink-muted')
    expect(btn).toBeDisabled()
  })

  it('outline buttons use the control outline', () => {
    render(<Button>copy link</Button>)
    expect(screen.getByRole('button', { name: 'copy link' })).toHaveClass('border-control-line', 'hover:border-ink')
  })

  it('adds layout classes from the caller and passes other props through', async () => {
    const onClick = vi.fn()
    render(<Button className="w-full" aria-pressed={true} onClick={onClick}>observing</Button>)
    const btn = screen.getByRole('button', { name: 'observing' })
    expect(btn).toHaveClass('w-full')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
