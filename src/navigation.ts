import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

let navigated = false;

export function landedOnRoom() {
  return !navigated && roomIdFrom(window.location.pathname) !== null;
}

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
  document.startViewTransition(() => flushSync(go));
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function roomPath(id: string) {
  return `/room/${encodeURIComponent(id)}`;
}

export const ROOM_PATH = /^\/room\/([^/]+)\/?$/;

export function roomIdFrom(pathname: string) {
  const id = ROOM_PATH.exec(pathname)?.[1];
  return id === undefined ? null : decodeURIComponent(id);
}
