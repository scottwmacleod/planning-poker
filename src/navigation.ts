import { useSyncExternalStore } from "react";

// Client-side navigation on the History API. There are two routes, so no router library.

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

export function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function roomPath(id: string) {
  return `/room/${encodeURIComponent(id)}`;
}

/** The room id from `/room/:id`, or null for any other path. */
export function roomIdFrom(pathname: string) {
  const id = /^\/room\/([^/]+)\/?$/.exec(pathname)?.[1];
  return id === undefined ? null : decodeURIComponent(id);
}
