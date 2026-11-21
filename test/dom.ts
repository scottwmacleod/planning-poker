import { JSDOM } from "jsdom";
import { afterEach, expect } from "vitest";

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "http://localhost:3000/",
  pretendToBeVisual: true,
});
const win = dom.window as unknown as Record<string, unknown>;

const keepBun = new Set([
  "console",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  "fetch",
  "Request",
  "Response",
  "Headers",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "structuredClone",
  "crypto",
  "performance",
  "WebSocket",
  "Blob",
  "File",
  "FormData",
  "AbortController",
  "AbortSignal",
]);

const keys = new Set<string>();
for (
  let proto: object | null = win;
  proto && proto !== Object.prototype;
  proto = Object.getPrototypeOf(proto)
) {
  for (const key of Object.getOwnPropertyNames(proto)) keys.add(key);
}

for (const key of keys) {
  if (key === "constructor") continue;
  if (keepBun.has(key) || key.startsWith("_")) continue;
  if (Object.getOwnPropertyDescriptor(globalThis, key)?.configurable === false) continue;
  const value = key === "window" || key === "self" || key === "globalThis" ? globalThis : win[key];
  const bound =
    typeof value === "function" && !/^[A-Z]/.test(key) ? (value as () => unknown).bind(win) : value;
  Object.defineProperty(globalThis, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: bound,
  });
}

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const matchers = await import("@testing-library/jest-dom/matchers");
expect.extend(matchers as unknown as Parameters<typeof expect.extend>[0]);
const { cleanup } = await import("@testing-library/react");
afterEach(() => {
  cleanup();
  localStorage.clear();
});
