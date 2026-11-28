@docs/agents/sm-conventions.md

# planning-poker

Real-time planning poker for agile teams. A React and Vite frontend on Vercel (`src/`, two routes on the History API), plus a PartyServer room server on Cloudflare Workers (`room-server/`, configured in `wrangler.jsonc`). `lib/types.ts` holds the messages both sides share. Domain terms are in `GLOSSARY.md`.

The rules every sm_ repo shares are in [`docs/agents/sm-conventions.md`](docs/agents/sm-conventions.md): definition of done, workflow, what to ask Scott first, the base copy, CI, tests, writing and agent skills. This file adds what only applies to planning-poker, and wins where the two differ.

## Definition of done

`bun run check` passes: typecheck, `bun lint`, Biome (CSS), `bun fmt`, `bun test` and the build. CI runs the same gates in the required `ci` check, plus a dry run of the room server bundle (`bun --bun x wrangler deploy --dry-run`).

Bun 1.4.5 is the package manager and the runtime (ADR-0003); the version lives only in `packageManager` in `package.json`. Scripts call `bun run` and `bun --bun x <tool>`, never `npm`, `npx` or `node`. Run tests with `bun run test` (`bun test --parallel`, ADR-0011): each file needs its own global, and `test/bun-setup.ts` gives jsdom to every file without `@vitest-environment node`. Test files import from `vitest`; the setup hoists `vi.mock` and `vi.hoisted` above the imports, as Vitest does, and adds the `vi` and `expect` helpers Bun lacks. Vercel bundles an older Bun, so `vercel.json`'s `installCommand` installs 1.4.5 first; drop that once Vercel ships Bun 1.4.

Typecheck runs `bun check --no-script` on the app and on `room-server` (Bun 1.4.5). `bun run typecheck:tsc` is the `tsc` fallback. If `bun check` misbehaves, switch `typecheck` back to it.

## Rules

- Merging to `main` deploys the room server (`deploy-worker` in `ci.yml`). Auto-merge merges with the `SM_MERGE_TOKEN` secret, because a merge made with `GITHUB_TOKEN` starts no workflows; the daily run on `main` deploys too, which covers Dependabot merges.
- Ask Scott before changing `wrangler.jsonc` or `.github/workflows/`, as well as the shared list in `sm-conventions.md`.
- `bun lint` comes from the pinned canary and `bun fmt` formats (ADR-0010). Biome lints only CSS and the few JavaScript rules `bun lint` lacks. Existing findings sit in `oxlint-suppressions.json`, which may only shrink: fix new code, never add to it.
- `bun lint` also loads `@shadcn/lint` for Tailwind classes: unknown classes, raw palette colours and arbitrary values fail. When no scale step fits, name the value as a `--poker-*` token in `src/index.css` and use it as an arbitrary variable, like `text-(length:--poker-text-card)`; don't allow-list it.
- `room-server/server.ts` is the worker's entry module: it may export only the fetch handler and Durable Object classes. Shared constants go in `lib/types.ts`.
- A PR body follows `/pr`, plus the template's browser test checklist below the product marker.

## Claude Code

- Run `/simplify` before pushing.

## Agent skills

### Issue tracker

GitHub Issues for `scottwmacleod/planning-poker`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` plus `docs/adr/` at the root. See `docs/agents/domain.md`.

### Shared skills

The UI skills, agent-browser and prune-tests live in `.claude/skills/`, with versions in `skills-lock.json`. When to use each is in `sm-conventions.md`; the browser-check setup is in `docs/agents/ui-browser-checks.md`. Update them with `npx skills update -p -y`, in every product in the same sitting.

### Implement loop

Repo rules for `/implement`: queue, branch, PR and merge mechanics, limits, and human-stop triggers. See `docs/agents/implement.md`.

For browser checks, `bun run build && bun run preview` serves the built app on port 4173. Run `bun run dev:room-server` beside it so rooms connect.
