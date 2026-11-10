// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const css = readFileSync(path.resolve(__dirname, '..', 'app/globals.css'), 'utf8')

describe('motion styles in globals.css', () => {
  it('defines the shared ease-out token', () => {
    expect(css).toContain('--ease-out: cubic-bezier(0.23, 1, 0.32, 1)')
  })

  it('gives .press a 160ms scale-down on :active', () => {
    expect(css).toMatch(/\.press:active:not\(:disabled\)\s*{[^}]*transform:\s*scale\(0\.97\)/)
    expect(css).toMatch(/\.press\s*{[^}]*transition:[^;}]*transform 160ms var\(--ease-out\)/)
  })

  it('grows distribution bars with scaleX from the left, not width', () => {
    expect(css).toMatch(/@keyframes bar-grow\s*{\s*from\s*{\s*transform:\s*scaleX\(0\)/)
    expect(css).toMatch(/\.bar-grow\s*{[^}]*transform-origin:\s*left/)
  })

  it('blinks the home cursor with a stepped animation', () => {
    expect(css).toMatch(/@keyframes blink/)
    expect(css).toMatch(/\.cursor-blink\s*{[^}]*step-end infinite/)
  })

  it('turns off the scale, bar growth and blink under reduced motion', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toMatch(/\.press:active\s*{\s*transform:\s*none/)
    expect(block).toMatch(/\.bar-grow\s*{\s*animation:\s*none/)
    expect(block).toMatch(/\.cursor-blink\s*{\s*animation:\s*none/)
  })
})
