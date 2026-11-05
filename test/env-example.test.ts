// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const sourceDirs = ['app', 'components', 'lib']

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : []
  })
}

describe('.env.example', () => {
  const envExample = path.join(root, '.env.example')

  it('exists', () => {
    expect(existsSync(envExample)).toBe(true)
  })

  it('is not ignored by git', () => {
    // git check-ignore exits 0 when the path is ignored, 1 when it isn't.
    const { status } = spawnSync('git', ['check-ignore', '-q', '.env.example'], { cwd: root })
    expect(status).toBe(1)
  })

  it('documents every NEXT_PUBLIC_ variable the app reads', () => {
    const used = new Set(
      sourceDirs
        .flatMap((d) => sourceFiles(path.join(root, d)))
        .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/process\.env\.(NEXT_PUBLIC_\w+)/g)])
        .map((m) => m[1]),
    )
    expect(used.size).toBeGreaterThan(0)
    const documented = readFileSync(envExample, 'utf8')
    for (const name of used) expect(documented).toMatch(new RegExp(`^#?\\s*${name}=`, 'm'))
  })
})
