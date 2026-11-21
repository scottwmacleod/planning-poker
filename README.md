# Planning Poker

Real-time planning poker for agile teams. Create a room, share the link, and everyone votes on an estimate at the same time. Votes stay hidden until everyone has voted (or someone reveals them), then everyone sees the cards, a tally of each value, and any outlier votes highlighted. Supports Fibonacci and T-shirt-size decks, spectators, and renaming yourself mid-session. There are no accounts and nothing to install for players.

Live site: https://planning-poker.scottmacleod.co

## How it fits together

- **Frontend:** a React app built with Vite (`src/`). Two routes, `/` and `/room/:id`, on the History API with no router library. `lib/types.ts` holds the message types the app and the room server share.
- **Room server:** a [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) Durable Object on Cloudflare Workers (`room-server/server.ts`, configured in `wrangler.jsonc`). Each room is one Durable Object; browsers connect to it over a WebSocket on the path `/parties/main/<room id>`, and it keeps the room's state and broadcasts every change to everyone in the room.

See [docs/adr/0001-partyserver-on-cloudflare.md](docs/adr/0001-partyserver-on-cloudflare.md) for why the room server runs on Cloudflare, and [docs/adr/0002-vite-instead-of-nextjs.md](docs/adr/0002-vite-instead-of-nextjs.md) for why the app uses Vite, and [docs/adr/0003-bun.md](docs/adr/0003-bun.md) for why it runs on Bun.

## Local setup

You need Bun 1.4.5 (the `packageManager` version in `package.json`, which CI and Vercel use) and Node.js 26 (the version in `.nvmrc`), which runs only the sm-core copy check. No Cloudflare or Vercel account is needed.

```bash
git clone https://github.com/scottwmacleod/planning-poker.git
cd planning-poker
bun install
bun run dev
```

`bun run dev` starts two servers side by side:

- the app on [http://localhost:5173](http://localhost:5173), served by Vite
- the room server on `localhost:1999`, run locally by `wrangler dev`

To check it works, open http://localhost:5173, click **Create Room**, enter your name and click **Enter Room**, then paste the room URL into a second browser window (or a private window) and join with another name. Votes in one window show up in the other.

To run the two servers in separate terminals, use `bun run dev:app` and `bun run dev:room-server`.

## Configuration

The only setting is where the frontend finds the room server. Copy [`.env.example`](.env.example) to `.env.local` if you need to change it.

| Variable                       | Default          | What it does                                                                                                                                    |
| ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ROOM_SERVER_HOST` | `localhost:1999` | Host of the room server, with no `https://`. In production this is the Cloudflare Worker host, `planning-poker.square-poetry-83d1.workers.dev`. |

`NEXT_PUBLIC_*` values are baked into the frontend at build time, so after changing one in Vercel you must redeploy. The prefix dates from Next.js; `vite.config.ts` exposes it so the Vercel variable didn't need renaming.

## Scripts

| Command              | What it does                                                                       |
| -------------------- | ---------------------------------------------------------------------------------- |
| `bun run dev`        | Start the app and the room server together                                         |
| `bun run test`       | Run the test suite once with `bun test`, in parallel and random order              |
| `bun run test:watch` | Run tests in watch mode                                                            |
| `bun run typecheck`  | Type-check the app and the room server                                             |
| `bun run check`      | Everything CI checks: typecheck, lint, tests, build and the sm-core copy           |
| `bun run lint`       | Lint with `bun lint` and Biome (CSS), and check formatting with `bun fmt`          |
| `bun run format`     | Format every file with `bun fmt`                                                   |
| `bun run build`      | Production build of the app into `dist/`                                           |
| `bun run preview`    | Serve the production build locally                                                 |
| `bun run cf-typegen` | Regenerate `room-server/worker-configuration.d.ts` after changing `wrangler.jsonc` |

CI runs the same gates through sm-core's shared workflows, plus a dry run of the room server bundle, on every pull request. They roll up into one required check, `ci`, which must pass before a PR can merge.

## Deployment

- **Frontend:** Vercel builds and deploys `main` automatically, and builds a preview for each pull request. `NEXT_PUBLIC_ROOM_SERVER_HOST` is set in the Vercel project's environment variables.
- **Room server:** the `deploy-worker` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `wrangler deploy` on every push to `main`, after CI passes. It needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The Worker is served at https://planning-poker.square-poetry-83d1.workers.dev.

## Contributing

Bug reports, feature requests and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to raise them, and [SECURITY.md](SECURITY.md) for reporting a vulnerability privately.

## Licence

[MIT](LICENSE)
