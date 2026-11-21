import { JSDOM } from "jsdom";
import { expect } from "vitest";

const KEEP_BUN = new Set([
  "AbortController",
  "AbortSignal",
  "Blob",
  "File",
  "FormData",
  "Headers",
  "ReadableStream",
  "Request",
  "Response",
  "TextDecoder",
  "TextEncoder",
  "TransformStream",
  "URL",
  "URLSearchParams",
  "WebSocket",
  "WritableStream",
  "clearInterval",
  "clearTimeout",
  "console",
  "constructor",
  "crypto",
  "fetch",
  "performance",
  "queueMicrotask",
  "setInterval",
  "setTimeout",
  "structuredClone",
]);
const SELF_REFERENCES = new Set(["globalThis", "self", "window"]);

function windowKeys(win: object): Set<string> {
  const keys = new Set<string>();
  let proto: unknown = win;
  while (proto !== null && proto !== Object.prototype && typeof proto === "object") {
    for (const key of Object.getOwnPropertyNames(proto)) keys.add(key);
    proto = Object.getPrototypeOf(proto);
  }
  return keys;
}

function shouldCopy(key: string): boolean {
  return (
    !KEEP_BUN.has(key) &&
    !key.startsWith("_") &&
    Object.getOwnPropertyDescriptor(globalThis, key)?.configurable !== false
  );
}

function globalValue(win: object, key: string): unknown {
  if (SELF_REFERENCES.has(key)) return globalThis;
  const value: unknown = Reflect.get(win, key);
  return typeof value === "function" && !/^[A-Z]/u.test(key) ? value.bind(win) : value;
}

export async function installDom(): Promise<() => void> {
  const { window } = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "http://localhost:3000/",
    pretendToBeVisual: true,
  });
  for (const key of windowKeys(window)) {
    if (shouldCopy(key)) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: globalValue(window, key),
      });
    }
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { default: _standalone, ...matchers } = await import("@testing-library/jest-dom/matchers");
  expect.extend(matchers);
  const { cleanup } = await import("@testing-library/react");
  return () => {
    cleanup();
    window.localStorage.clear();
  };
}
