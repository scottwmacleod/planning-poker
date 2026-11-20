import { type ComponentProps, lazy } from "react";

// The room page (socket client, deck, results) is its own chunk, so Home
// visitors don't download it. Home prefetches it, a direct room link preloads it
// from index.html (see roomPreload in vite.config.ts), and main.tsx waits for it
// before the first render on a room path.

type RoomPage = typeof import("./pages/Room").default;

let loaded: RoomPage | null = null;
let loading: Promise<{ default: RoomPage }> | null = null;

/** Fetches the room chunk once; a failed fetch is tried again on the next call. */
function loadRoom() {
  loading ??= import("./pages/Room").then(
    (m) => {
      loaded = m.default;
      return m;
    },
    (error) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}

const LazyRoom = lazy(loadRoom);

/**
 * The room page. Once the chunk has loaded it renders straight away: a lazy
 * component suspends on its first render even when its chunk is ready, and
 * React then holds the fallback for up to 300 ms.
 */
export function Room(props: ComponentProps<RoomPage>) {
  const Page = loaded ?? LazyRoom;
  return <Page {...props} />;
}

/** Starts fetching the room chunk; safe to call often. Never rejects: a failed
 * prefetch is tried again when the room renders, which shows the error. */
export function prefetchRoom() {
  return loadRoom().then(
    () => {},
    () => {},
  );
}
