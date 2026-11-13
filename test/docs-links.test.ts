// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const docs = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'GLOSSARY.md', 'docs/accessibility-audit.md', 'docs/adr/0001-partyserver-on-cloudflare.md']

describe('docs links', () => {
  it('README points the live site at the custom domain', () => {
    const readme = readFileSync(path.join(root, 'README.md'), 'utf8')
    expect(readme).toContain('Live site: https://planning-poker.scottmacleod.co')
    expect(readme).not.toContain('planning-poker-eta-neon')
  })

  it.each(docs)('%s only links to files that exist', (doc) => {
    const text = readFileSync(path.join(root, doc), 'utf8')
    const targets = [...text.matchAll(/\]\(([^)\s]+)\)/g)]
      .map((m) => m[1])
      .filter((t) => !/^(https?:|mailto:|#)/.test(t))
    for (const target of targets) {
      const file = decodeURIComponent(target.split('#')[0])
      expect(existsSync(path.resolve(root, path.dirname(doc), file)), `${doc} -> ${target}`).toBe(true)
    }
  })
})
