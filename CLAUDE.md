@AGENTS.md

# planning-poker — Claude Code Instructions

## Project

Real-time planning poker for agile teams. Next.js frontend + PartyKit WebSocket server. Deployed on Vercel (frontend) and PartyKit cloud (server).

## Role

Claude is implementer. Make technical decisions independently. Explain outcomes in plain English — do not ask Scott to evaluate technical trade-offs.

## Git workflow

- Every piece of work goes on a new branch
- After every change: commit with descriptive message, then push to feature branch immediately
- Never push to main
- Scott reviews and merges

## TDD

Red/Green/Refactor. Write failing test first. Then implement. Then make it green. No exceptions.

Run tests before pushing: `npm test`

## Self-review

Before pushing, run `/simplify` to check for unnecessary complexity.

## Handoff

When a feature is ready, open a PR with:
1. **What it does** — plain English, no jargon
2. **What's not done yet** — honest about gaps
3. **Test checklist** — step-by-step how to verify in the browser

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`scottwmacleod/planning-poker`, via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Off-limits without explicit approval

- Adding third-party dependencies
- Changing PartyKit server config (`partykit.json`)
- Modifying CI/CD pipeline (`.github/workflows/`)
