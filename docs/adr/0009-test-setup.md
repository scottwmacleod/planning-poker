# Test setup

How the tests run, and the workarounds they rely on. Moved here from code comments on 21 Nov 2026.

- **Tests run shuffled** (`randomize` in `bunfig.toml`), so `test/bun-setup.ts` resets anything one test could leak into the next. ADR-0011 covers the runner.
- **The room server tests run in Node with `partyserver` mocked.** partyserver imports `cloudflare:workers`, which only exists in the Workers runtime, so `server.test.ts` swaps in a minimal `Server`. That tests our stand-in, not partyserver: #134 moves these tests into workerd.
- **The room page tests replace PartySocket** with a stand-in that records what the page sends and lets a test fire `open` and `message` events by hand, including a second `open` to act out a reconnect.
- **Clipboard stubs go after `userEvent.setup()`**, which installs its own clipboard stub.
- **axe runs without colour contrast.** jsdom does no layout, so axe can't measure it. Contrast is checked in sm-core (every token pair) and by Lighthouse and pa11y in CI.
- **The lint test writes real files.** Biome's stdin mode always exits 0 with `--write` and 1 without, so it can't tell a pass from a fail.
- **The icons are byte-for-byte copies of the sm-core logos**, and a test compares them, so they can't drift.
- **The merge-token test** checks that auto-merge uses `SM_MERGE_TOKEN` (see ADR-0004). sm-core's `auto-merge.yml` only arms PRs from branches in this repo, not forks.
