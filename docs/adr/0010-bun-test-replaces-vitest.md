# bun test replaces Vitest

Decided on 21 Nov 2026, as part of Scott's CI speed brief. Supersedes the "Vitest stays" and "Replace Vitest with `bun test`" points in ADR-0003.

`bun run test` is `bun test --parallel`: one worker per core, each test file in a fresh global (`--parallel` implies `--isolate`), tests in random order (`randomize = true` in `bunfig.toml`; the seed prints on every run). Vitest is gone from the dependencies.

## Why the jsdom tests failed under `bun test`

ADR-0003 saw 90 of 153 tests fail. The causes, all fixed in `test/`:

1. **No DOM.** `bun test` doesn't read `vite.config.ts`, so `environment: "jsdom"` and `setupFiles` never applied: `document is not defined`. `test/dom.ts` builds a jsdom window and puts its properties on the global, keeping Bun's own `fetch`, timers, `URL`, streams and similar. It walks the window's prototype chain too, or `window.dispatchEvent` stays Bun's and rejects jsdom events. It also loads the jest-dom matchers, sets `IS_REACT_ACT_ENVIRONMENT` and runs Testing Library's `cleanup` after each test.
2. **`vi.mock` isn't hoisted.** Bun loads a test's imports first and patches the mocked module afterwards. That breaks `server.test.ts` (real `partyserver` imports `cloudflare:workers`, which Bun can't find) and any class that extends a mocked export. `test/vitest-hoist.ts`, run by a Bun plugin on every `*.test.ts(x)`, moves top-level `vi.mock` and `vi.hoisted` above the imports, turning the other imports into `await import()`, as Vitest does. `vi.mock` factories get `importOriginal`.
3. **Missing helpers.** Bun's `vi` has no `stubGlobal`, `unstubAllGlobals`, `stubEnv`, `unstubAllEnvs`, `hoisted`, `mocked` or `waitFor`, and its `expect` has no `fail` or `toHaveBeenCalledExactlyOnceWith`. `test/bun-setup.ts` adds them and resets mocks, timers, stubbed globals and env after every test.

`test/vitest.d.ts` types the `vitest` module as `bun:test` plus those helpers and the jest-dom matchers. Bun's `toEqual` and `toBe` types are stricter than Vitest's.

A file with `@vitest-environment node` gets no DOM: the preload reads the docblock from `Bun.main`, which is the file being run under `--parallel` or `--isolate`. So always run several files with one of those flags (`bun run test`, `bun run test:watch`).

## Side by side

On the same commit (Bun 1.4.5, 4 cores), Vitest and `bun test` ran the same 303 tests in the same 25 files, matched by file and full name, all passing. A planted bug in `navigate` failed the same one test under both. Locally Vitest took 7.4-7.8 s and `bun test --parallel` takes 3.1-3.7 s, bound by `Room.test.tsx` (about 2.3 s on its own).
