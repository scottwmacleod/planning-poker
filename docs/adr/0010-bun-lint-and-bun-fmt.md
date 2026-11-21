# Lint with bun lint, format with bun fmt

Decided by Scott on 2026-11-21 in the CI speed brief. Supersedes the "Biome stays" line in ADR-0003. The suite-wide record, with every rule turned off and why, is sm-core's ADR-0009.

- `bun lint` lints JavaScript and TypeScript with every rule in `vendor/sm-core/tooling/oxlintrc.base.json` (704, type-aware). `.oxlintrc.json` adds the ui-sdk import ban (ADR-0008) and lets tests use `!`, as `biome.json` did. It runs from the pinned canary, `bun@1.4.5-canary.20261120.1`, because no stable Bun has it yet.
- The 810 findings the code already had are in `oxlint-suppressions.json`. New code meets every rule. `bun lint` fails on a new finding and on a suppression that no longer matches, so the file only shrinks.
- `bun fmt` formats everything except `vendor`, the synced files, `wrangler.jsonc` (Scott approves changes to it) and the generated `worker-configuration.d.ts`, with `.oxfmtrc.json` from sm-core. Moving to it reformatted 30 files: imports regrouped (a blank line between package and local imports) and `package.json` keys reordered.
- Biome stays for what `bun lint` can't check: the recommended CSS rules and 9 JavaScript rules. It runs `biome lint`, with its formatter and import sorting off.
- `test/lint.test.ts` plants files and runs the real tools: four cases now run `bun lint`, and a new one checks Biome still fails a duplicate CSS property.

## Side by side, same commit, 4-core cloud machine, median of 5 warm runs

| Step                       | Before                               | After                                    |
| -------------------------- | ------------------------------------ | ---------------------------------------- |
| `bun run lint` (all of it) | 173 ms (`biome check` + no-comments) | 394 ms                                   |
| JS/TS lint                 | Biome, about 220 rules               | `bun lint`, 704 rules type-aware: 245 ms |
| CSS lint                   | Biome                                | Biome, CSS + 9 JS rules: 82 ms           |
| Format check               | Biome                                | `bun fmt --check`: 10 ms                 |

Slower because it checks over three times as many rules, half with types; inside the 1-second budget.
