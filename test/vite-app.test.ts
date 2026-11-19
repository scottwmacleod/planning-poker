// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

describe('index.html', () => {
  const html = read('index.html')

  it('keeps the title, description and language', () => {
    expect(html).toContain('<html lang="en"')
    expect(html).toContain('<title>Planning Poker</title>')
    expect(html).toContain('<meta name="description" content="Real-time planning poker for agile teams"')
  })

  it('links the favicon, SVG icon and apple-touch icon from public/', () => {
    for (const href of ['/favicon.ico', '/icon.svg', '/apple-icon.png']) {
      expect(html).toContain(`href="${href}"`)
      expect(existsSync(path.join(root, 'public', href))).toBe(true)
    }
  })

  it('paints the ground colour before the app mounts', () => {
    expect(html).toMatch(/<body class="[^"]*bg-ground/)
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>')
  })
})

describe('Vercel config', () => {
  const vercel = JSON.parse(read('vercel.json'))

  it('builds with Vite into dist', () => {
    expect(vercel.framework).toBe('vite')
    expect(vercel.outputDirectory).toBe('dist')
  })

  it('serves index.html for /room/:id so a hard refresh loads the room', () => {
    expect(vercel.rewrites).toContainEqual({ source: '/room/:id', destination: '/index.html' })
  })
})

describe('Next.js is gone', () => {
  const pkg = JSON.parse(read('package.json'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  it.each(['next', 'eslint-config-next'])('drops %s', (name) => {
    expect(deps[name]).toBeUndefined()
  })

  it.each(['next.config.ts', 'next-env.d.ts', 'app'])('removes %s', (file) => {
    expect(existsSync(path.join(root, file))).toBe(false)
  })
})

describe('self-hosted fonts', () => {
  it('loads Geist and Geist Mono from @fontsource, not Google', () => {
    const css = read('src/index.css')
    expect(css).toContain('@import "@fontsource/geist/')
    expect(css).toContain('@import "@fontsource/geist-mono/')
    expect(read('index.html')).not.toContain('fonts.googleapis.com')
  })
})
