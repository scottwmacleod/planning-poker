import { describe, it, expect } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import Input from './Input'

describe('Input', () => {
  it('is a text input with the brand corners, outline and focus ring', () => {
    render(<Input aria-label="name" />)
    const input = screen.getByRole('textbox', { name: 'name' })
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveClass('rounded-1', 'border-control-line', 'bg-surface', 'focus-ring')
  })

  it('has a compact size for inline editing', () => {
    render(<Input aria-label="name" size="sm" className="w-28" />)
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveClass('text-sm', 'w-28')
  })

  it('forwards its ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input aria-label="name" ref={ref} />)
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'name' }))
  })
})
