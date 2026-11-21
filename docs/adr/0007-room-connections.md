# Room connections

How browsers reach a room and stay in it. Moved here from code comments on 21 Nov 2026.

## Room server (`room-server/server.ts`)

- **Origin allowlist.** The worker refuses any request whose `Origin` isn't the production site, the Vercel preview and branch deployments (`planning-poker-<anything>-scottwmacleods-projects.vercel.app`) or localhost. Browsers always send `Origin`, so this stops other websites using the server. It doesn't stop scripts, which can send any `Origin` they like; it isn't meant to.
- **Messages are validated.** Anything the protocol in `lib/types.ts` doesn't allow is dropped. Names are trimmed and capped at 24 characters, and an empty name is rejected.
- **The entry module exports only the fetch handler and Durable Object classes.** workerd refuses to start otherwise, so `wrangler dev` and deploys fail. Shared constants go in `lib/types.ts`. A test in `server.test.ts` guards this.
- **Local dev runs on port 1999**, which is what the client falls back to when no host is set.

## Client (`src/pages/Room.tsx`)

- **A full room stops the retries.** The server closes with `ROOM_FULL_CODE` (4000) once a room has 50 connections. A full room would turn every reconnect away too, so the client closes the socket for good and shows the room-full state.
- **A reconnect rejoins with the latest values.** PartySocket reconnects on the same instance and re-runs the `open` handler. The handler reads the name and observer setting from refs that track what was last sent to the server, so a reconnect doesn't rejoin with the values the page started with.
- **The stored name is read on the first render**, so a returning visitor's socket opens on mount and the name form never flashes up.
- **Editing your name hands focus back.** Saving with Enter or cancelling with Escape unmounts the input, so focus returns to the name button. A blur from clicking elsewhere leaves focus where the click put it.
- **Copying the link can fail.** `navigator.clipboard` is missing on non-HTTPS pages, and `writeText` rejects when the browser denies permission, so the button says "copy failed". A second click restarts the 2 s window instead of stacking timers.
- **Leaving is navigation.** There's no leave button. Going home unmounts the room, which closes the socket, so others see the leave notice. Modified clicks on the home link keep the browser's open-in-new-tab behaviour.
- **The room server host** is read when connecting, not at import, so tests can stub it per case. Its `NEXT_PUBLIC_` name is a Next.js leftover: see #65 and #135.
