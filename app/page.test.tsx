import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('nanoid', () => ({ nanoid: () => 'newroom1' }))

import Home from './page'

beforeEach(() => push.mockClear())

describe('Home page', () => {
  it('titles the page planning-poker with a decorative cursor block', () => {
    const { container } = render(<Home />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('planning-poker')
    expect(h1).toHaveClass('font-mono')
    const cursor = container.querySelector('h1 [aria-hidden="true"]')
    expect(cursor).toHaveClass('bg-signal')
  })

  it('creates a room from the lime "create room" button', async () => {
    render(<Home />)
    const btn = screen.getByRole('button', { name: 'create room' })
    expect(btn).toHaveTextContent('create room →')
    expect(btn).toHaveClass('bg-signal', 'text-on-signal')
    await userEvent.click(btn)
    expect(push).toHaveBeenCalledWith('/room/newroom1')
  })

  it('shows join room as a disabled outline button until an ID is typed', () => {
    render(<Home />)
    const join = screen.getByRole('button', { name: 'join room' })
    expect(join).toBeDisabled()
    expect(join).not.toHaveClass('bg-signal')
    expect(join).toHaveClass('border-control-line')
  })

  it('turns join room lime and enabled once an ID is typed, then joins', async () => {
    render(<Home />)
    await userEvent.type(screen.getByLabelText('room id'), ' abc123 ')
    const join = screen.getByRole('button', { name: 'join room' })
    expect(join).toBeEnabled()
    expect(join).toHaveClass('bg-signal', 'text-on-signal')
    await userEvent.click(join)
    expect(push).toHaveBeenCalledWith('/room/abc123')
  })

  it('treats a whitespace-only ID as empty', async () => {
    render(<Home />)
    await userEvent.type(screen.getByLabelText('room id'), '   ')
    const join = screen.getByRole('button', { name: 'join room' })
    expect(join).toBeDisabled()
    expect(join).not.toHaveClass('bg-signal')
  })

  it('styles the room ID input with the surface fill, hairline border and shared focus ring', () => {
    render(<Home />)
    const input = screen.getByLabelText('room id')
    expect(input).toHaveClass('bg-surface', 'border-control-line', 'rounded-1', 'focus-ring')
  })

  it('links to scottmacleod.co from the footer', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: 'by scottmacleod.co' })
    expect(link).toHaveAttribute('href', 'https://scottmacleod.co')
    expect(link.closest('footer')).not.toBeNull()
  })

  it('uses no indigo, gray, shadow or large-radius utilities', () => {
    const { container } = render(<Home />)
    const classes = Array.from(container.querySelectorAll('[class]'))
      .map(el => el.getAttribute('class'))
      .join(' ')
    expect(classes).not.toMatch(/indigo|gray|shadow|rounded-(xl|lg|md|2xl|full)|gradient/)
  })
})
