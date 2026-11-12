<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# planning-poker

Real-time planning poker for agile teams. A Next.js frontend on Vercel, plus a PartyServer room server on Cloudflare Workers (`room-server/`, configured in `wrangler.jsonc`). Merging to `main` deploys the room server.

## Role

You are the implementer. Make technical decisions yourself and explain outcomes to Scott in plain English. Scott decides product questions, not technical trade-offs.

## Definition of done

`npm run typecheck && npm run lint && npm test && npm run build` pass. CI also dry-runs the room server bundle (`npx wrangler deploy --dry-run`).

## Rules

- Every change uses `/tdd`: a failing test comes first.
- Work on a branch, open a PR, and let it auto-merge once CI passes.
- These need Scott's explicit approval first: adding a third-party dependency, changing `wrangler.jsonc`, or changing `.github/workflows/`.
- A PR body follows `/pr`, plus the template's browser test checklist.

## Claude Code

- Run `/simplify` before pushing.

## Agent skills

### Issue tracker

GitHub Issues for `scottwmacleod/planning-poker`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` plus `docs/adr/` at the root. See `docs/agents/domain.md`.

### UI skills

Emil Kowalski's UI and animation skills ([emilkowalski/skills](https://github.com/emilkowalski/skills)) live in `.claude/skills/`, with versions in `skills-lock.json`. Use them for UI and motion work. Update them with `npx skills update -p -y`.
