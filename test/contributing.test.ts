// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

const triageLabels = [...read('docs/agents/triage-labels.md').matchAll(/^\| `[^`]+` +\| `([^`]+)`/gm)].map((m) => m[1])
const issueForms = ['.github/ISSUE_TEMPLATE/bug-report.yml', '.github/ISSUE_TEMPLATE/feature-request.yml']

describe('outside contributions', () => {
  it.each(issueForms)('%s files the issue as needs-triage, one of our triage labels', (form) => {
    const labels = read(form).match(/^labels: \[(.*)\]$/m)?.[1].split(',').map((l) => l.trim().replace(/"/g, ''))
    expect(labels).toEqual(['needs-triage'])
    expect(triageLabels).toEqual(expect.arrayContaining(labels!))
  })

  it('turns off blank issues so reporters pick a form', () => {
    expect(read('.github/ISSUE_TEMPLATE/config.yml')).toMatch(/^blank_issues_enabled: false$/m)
  })

  it('README points contributors at CONTRIBUTING.md', () => {
    expect(read('README.md')).toContain('](CONTRIBUTING.md)')
  })

  it('CONTRIBUTING.md states the same definition of done as AGENTS.md', () => {
    const done = 'npm run typecheck && npm run lint && npm test && npm run build'
    expect(read('AGENTS.md')).toContain(done)
    expect(read('CONTRIBUTING.md')).toContain(done)
  })

  it('SECURITY.md sends reports to private vulnerability reporting', () => {
    expect(read('SECURITY.md')).toContain('https://github.com/scottwmacleod/planning-poker/security/advisories/new')
  })
})
