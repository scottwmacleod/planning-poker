import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkbox from './Checkbox'

describe('Checkbox', () => {
  it('is a real checkbox named by its label', async () => {
    render(<Checkbox label="i'm just observing" />)
    const box = screen.getByRole('checkbox', { name: "i'm just observing" })
    expect(box).not.toBeChecked()
    await userEvent.click(screen.getByText("i'm just observing"))
    expect(box).toBeChecked()
  })

  it('drops the OS look for a square box that matches a selected card', () => {
    render(<Checkbox label="observe" />)
    expect(screen.getByRole('checkbox')).toHaveClass(
      'appearance-none',
      'rounded-1',
      'border-control-line',
      'checked:border-signal-ink',
      'checked:bg-signal-tint',
      'focus-ring',
    )
  })
})
