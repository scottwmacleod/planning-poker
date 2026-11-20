import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

// Client-side navigation on the History API. There are two routes, so no router library.

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

let navigated = false;

/** True until the app first navigates, so a timing from page load means the visit began here. */
export function landedOnRoom() {
  return !navigated && roomIdFrom(window.location.pathname) !== null;
}

/** Moves to `path`, cross-fading the pages where View Transitions exist and motion is welcome. */
export function navigate(path: string) {
  navigated = true;
  const go = () => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }
  // flushSync renders the new page inside the callback, so the transition captures it.
  document.startViewTransition(() => flushSync(go));
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function roomPath(id: string) {
  return `/room/${encodeURIComponent(id)}`;
}

/** `/room/:id`. vite.config.ts reuses it in the inline script that preloads the room chunk. */
export const ROOM_PATH = /^\/room\/([^/]+)\/?$/;

/** The room id from `/room/:id`, or null for any other path. */
export function roomIdFrom(pathname: string) {
  const id = ROOM_PATH.exec(pathname)?.[1];
  return id === undefined ? null : decodeURIComponent(id);
}
