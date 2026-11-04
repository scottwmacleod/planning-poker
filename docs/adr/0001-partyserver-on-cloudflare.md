# 1. Run the room server on PartyServer + Cloudflare Durable Objects

- Status: Accepted
- Date: 2026-11-04
- Decided by: Scott
- Issue: #8

## Context

PartyKit's hosted platform stopped deploys on 2026-10-16 and shut down on 2026-10-23, so the room server in `party/server.ts` has nowhere to run and the live app has no real-time backend.

The replacement must keep one authoritative room per room id, the message protocol in `lib/types.ts`, a stable id per connection, clean-up on disconnect (it drives auto-reveal), client auto-reconnect, a local dev server and a non-interactive CI deploy.

## Decision

Move the room server to [PartyServer](https://docs.partykit.io/guides/migrate-to-partyserver/), deployed with Wrangler as a Cloudflare Worker backed by Durable Objects, on Cloudflare's free plan. Keep `partysocket` on the client. The Next.js frontend stays on Vercel.

Scott approved the changes this needs under CLAUDE.md: adding `partyserver` and `wrangler`, removing `partykit`, replacing `partykit.json` with `wrangler.jsonc`, and changing the CI deploy job to `wrangler deploy`.

## Options considered

- **PartyServer on Cloudflare** (chosen): same room class shape and client library; free tier covers about 29 open room-hours a day; about a day of work.
- **Vercel WebSockets** (public beta since 2026-06-22): instances don't share memory, so room state would need Redis and pub/sub, and connections close at the function time limit.
- **Self-hosted `ws` server** (e.g. Render): close to today's design, but we would own routing, uptime and cold starts (free tier sleeps after 15 idle minutes).
- **Supabase Realtime, Ably, Pusher, Liveblocks**: no server-side room, so auto-reveal and other room rules would move into the clients; a large rewrite. Liveblocks' free plan also caps rooms at 10 connections.

## Consequences

- The project needs a Cloudflare account and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets in GitHub.
- Room state stays in memory, with no persistence, as before. If usage outgrows the free plan's duration allowance, the next step is WebSocket hibernation (which needs room state saved to storage) or the Workers Paid plan.
