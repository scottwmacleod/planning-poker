# CI, merging and room server deploys

The shared rules (one required check named `ci`, squash auto-merge, the `hold` label, Dependabot majors waiting for Scott) are in `docs/agents/sm-conventions.md`. This records what planning-poker adds on top, moved here from comments in `.github/workflows/` on 21 Nov 2026.

- **`ci` rolls up everything.** It passes only when every job in sm-core's `web-ci` workflow, the bundle budgets and the room server dry-run bundle passed. Branch protection requires `ci` and nothing else, so adding a job never needs a ruleset change.
- **Merging to `main` deploys the room server.** Auto-merge turns on with `SM_MERGE_TOKEN`, Scott's token, because a merge made with `GITHUB_TOKEN` starts no workflows on `main`, and the room server wouldn't deploy.
- **A daily run on `main` backs that up.** It deploys anything merged without the token (Dependabot merges), and seeds the `node_modules` cache and `main`'s bundle sizes, which PR runs compare against.
- **`audit` is not a required check.** A new advisory can turn it red on a PR that changed nothing related, and that shouldn't block the merge.
- **`behind` runs weekly.** It opens one issue when `vendor/sm-core` is older than sm-core's latest release, or a pinned agent tool has a newer version, and closes it once both are current.
