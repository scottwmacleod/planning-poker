# Vite instead of Next.js

planning-poker's frontend is a client app: every screen talks to the room server over a WebSocket, and nothing renders on a server. Next.js's server features added weight without helping, so the app moved to React on Vite (planning-poker#82), the same stack as the rest of the sm_ suite (scottwmacleod/sm-core#3).

Routing is two paths, `/` and `/room/:id`, on the History API with no router library. Vercel serves `index.html` for every path that isn't a file so a hard refresh loads the room. Geist and Geist Mono are self-hosted through `@fontsource`.

First-load JS on the home page went from 134 kB to 76 kB gzipped.

## Considered options

- **Keep Next.js with static export.** Smaller change, but it keeps a framework whose server features we don't use, and the suite would still run two stacks.
- **A router library.** Two routes don't need one.
