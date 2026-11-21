import { plugin } from "bun";
import { afterEach, expect, mock, vi } from "vitest";
import { hoistMocks } from "./vitest-hoist";

if (!/@vitest-environment node/.test(await Bun.file(Bun.main).text())) await import("./dom");

plugin({
  name: "vitest-compat",
  setup(build) {
    build.onLoad({ filter: /\.test\.tsx?$/ }, async ({ path }) => {
      const source = await Bun.file(path).text();
      return { contents: hoistMocks(source), loader: path.endsWith("x") ? "tsx" : "ts" };
    });
  },
});

Object.assign(globalThis, {
  async __vitestMock(
    dir: string,
    specifier: string,
    factory: (importOriginal: () => Promise<unknown>) => unknown,
  ) {
    const resolved = Bun.resolveSync(specifier, dir);
    let original: Record<string, unknown> | undefined;
    const importOriginal = async () => (original ??= { ...(await import(resolved)) });
    if (factory.length > 0) await importOriginal();
    const exports = await factory(importOriginal);
    mock.module(resolved, () => exports as Record<string, unknown>);
  },
});

const realSetTimeout = globalThis.setTimeout;
const stubbedGlobals = new Map<PropertyKey, PropertyDescriptor | undefined>();
const stubbedEnvs = new Map<string, string | undefined>();

Object.assign(vi, {
  stubGlobal(name: PropertyKey, value: unknown) {
    if (!stubbedGlobals.has(name)) {
      stubbedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    }
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return vi;
  },
  unstubAllGlobals() {
    for (const [name, original] of stubbedGlobals) {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    }
    stubbedGlobals.clear();
    return vi;
  },
  stubEnv(name: string, value: string | undefined) {
    if (!stubbedEnvs.has(name)) stubbedEnvs.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
    return vi;
  },
  unstubAllEnvs() {
    for (const [name, original] of stubbedEnvs) {
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    }
    stubbedEnvs.clear();
    return vi;
  },
  hoisted<T>(factory: () => T): T {
    return factory();
  },
  mocked<T>(item: T): T {
    return item;
  },
  async waitFor<T>(
    callback: () => T | Promise<T>,
    options: number | { timeout?: number; interval?: number } = {},
  ) {
    const { timeout = 1000, interval = 50 } =
      typeof options === "number" ? { timeout: options } : options;
    const deadline = Date.now() + timeout;
    for (;;) {
      try {
        return await callback();
      } catch (error) {
        if (Date.now() >= deadline) throw error;
        await new Promise((resolve) => realSetTimeout(resolve, interval));
      }
    }
  },
});

Object.assign(expect, {
  fail(message?: string): never {
    return expect.unreachable(message);
  },
});

expect.extend({
  toHaveBeenCalledExactlyOnceWith(received: unknown, ...expected: unknown[]) {
    const calls = (received as { mock: { calls: unknown[][] } }).mock.calls;
    const pass = calls.length === 1 && this.equals(calls[0], expected);
    return {
      pass,
      message: () =>
        `expected one call with ${this.utils.printExpected(expected)}, got ${this.utils.printReceived(calls)}`,
    };
  },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
