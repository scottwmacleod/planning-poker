# Contributing

Thanks for wanting to help with planning-poker. Bug reports, feature ideas and pull requests are all welcome.

## Reporting a bug or asking for a feature

- **Bug:** open an issue with the [bug report form](https://github.com/scottwmacleod/planning-poker/issues/new?template=bug-report.yml).
- **Feature:** open an issue with the [feature request form](https://github.com/scottwmacleod/planning-poker/issues/new?template=feature-request.yml).
- **Question or rough idea:** start a [discussion](https://github.com/scottwmacleod/planning-poker/discussions).
- **Security problem:** follow [SECURITY.md](SECURITY.md). Don't open a public issue.

New issues get the `needs-triage` label. The maintainer then relabels them: `needs-info` means we're waiting on you, `ready-for-agent` or `ready-for-human` means it's accepted and ready to build, and `wontfix` means it won't go ahead. The labels are described in [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

## Before you write code

Open an issue first, and wait until it's labelled `ready-for-agent` or `ready-for-human`. A pull request without an accepted issue may be closed, however good it is, because the change might not fit the project. Small fixes such as typos are the exception.

Don't add a new dependency, change `wrangler.jsonc`, or change anything in `.github/workflows/` without agreeing it in the issue first.

## Running it locally

You need Node.js 24 (see `.nvmrc`) and npm. No Cloudflare or Vercel account is needed.

```bash
git clone https://github.com/<your-username>/planning-poker.git
cd planning-poker
npm install
npm run dev
```

The [README](README.md#local-setup) explains how to check it works with two browser windows.

Read [GLOSSARY.md](GLOSSARY.md) before naming anything, and use its terms in code, tests and the UI. Decisions about how the project is built are in [docs/adr/](docs/adr/).

## Making the change

- Write a failing test first, then make it pass. Tests use Vitest and Testing Library and live next to the code or in `test/`.
- Keep each pull request to one issue.
- Your change is done when this passes:

  ```bash
  npm run typecheck && npm run lint && npm test && npm run build
  ```

## Opening the pull request

- Fill in the pull request template, including `Closes #<issue>` and the browser test checklist.
- CI runs the same checks. On pull requests from forks it waits until the maintainer approves the run.
- The maintainer reviews and merges outside contributions by hand.

By contributing you agree that your work is released under the project's [MIT licence](LICENSE).
