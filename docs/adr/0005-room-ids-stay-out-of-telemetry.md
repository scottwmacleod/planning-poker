# Room ids stay out of telemetry

A room id is the only thing that lets someone into a room: anyone with the link can join. So no room id may reach PostHog or Cloudflare's logs, and nothing sent to PostHog may carry a participant's name or vote. Moved here from code comments on 21 Nov 2026.

## In the app (`src/analytics.ts`)

- PostHog's `before_send` hook replaces `/room/<id>` with `/room/:id` in every property of every event, including the nested stack frames of `$exception` events.
- Autocapture and session recordings mask all text and inputs, because participant names are on screen and in inputs.
- The goal events (`room_created`, `room_joined`, `vote_cast`, `votes_revealed`) never carry a room id, a name or a vote value. `room_joined` says whether this tab created the room from an in-memory set of the rooms it created, so nothing is stored.
- `room_joined` fires once per visit, not on every reconnect. `socket_ms` runs from opening the socket to the first room state. `load_ms` runs from the start of the page load, and is sent only when the visit began on the room page.
- Source maps are public so PostHog can read stack traces from the deployed site. The repo is public anyway.
- The PostHog project token lives in `lib/types.ts`. It is public by design: a project token can only write events.

## In the room server (`room-server/`)

- Every Durable Object handler runs inside `PokerRoom.report`, which catches what it throws. Otherwise partyserver logs the error with the room id, and Workers Logs reach PostHog too.
- `reportError` logs a summary with the room path scrubbed, then posts an `$exception` event straight to PostHog's capture API. It uses one distinct id for the whole server and no person profile: these errors belong to no visitor.
- It reports at most once per handler a minute from each isolate, so an error that fires on every message can't flood PostHog. The log line still goes out every time.
- The send goes through `waitUntil`, so it adds no latency to the response. A failed send is dropped: reporting must never break a room.

## Logs (`wrangler.jsonc`)

- Workers Logs go to PostHog Logs through the `posthog-logs` OpenTelemetry destination (Cloudflare dashboard: Observability > Destinations). Cloudflare exports them outside the worker, so they add no latency, and `persist: false` keeps no second copy in Cloudflare.
- Invocation logs are off because they carry the request URL, which holds the room id. The worker logs its own lines without it.
- Errors go to PostHog error tracking from the worker itself, as above, not through the logs.
