// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
const nvmrc = read('.nvmrc').trim()

describe('Node version', () => {
  it('pins the current LTS, Node 26, in .nvmrc', () => {
    expect(nvmrc).toBe('26')
  })

  it('declares the same major in engines', () => {
    expect(JSON.parse(read('package.json')).engines?.node).toBe(`>=${nvmrc}`)
  })

  it.each(['README.md', 'CONTRIBUTING.md'])('%s names the .nvmrc version', (file) => {
    expect(read(file)).toContain(`Node.js ${nvmrc}`)
  })
})
