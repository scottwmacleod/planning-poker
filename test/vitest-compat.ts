import { plugin } from "bun";
import { expect, mock, vi } from "vitest";

import { hoistMocks } from "./vitest-hoist";

type WaitForOptions = number | { timeout?: number; interval?: number };
type ModuleExports = Record<string, unknown>;
type MockFactory = (
  importOriginal: () => Promise<ModuleExports>,
) => ModuleExports | Promise<ModuleExports>;

const realSetTimeout = globalThis.setTimeout;
const stubbedGlobals = new Map<PropertyKey, PropertyDescriptor | undefined>();
const stubbedEnvs = new Map<string, string | undefined>();

function hasMockCalls(value: unknown): value is { mock: { calls: unknown[][] } } {
  return typeof value === "function" && "mock" in value;
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function copyExports(namespace: object): ModuleExports {
  return Object.fromEntries(
    Object.keys(namespace).map((key): [string, unknown] => [key, Reflect.get(namespace, key)]),
  );
}

async function pause(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    realSetTimeout(resolve, ms);
  });
}

async function retryUntil<T>(
  assertion: () => T | Promise<T>,
  deadline: number,
  interval: number,
): Promise<T> {
  try {
    return await assertion();
  } catch (error) {
    if (Date.now() >= deadline) throw error;
    await pause(interval);
    return retryUntil(assertion, deadline, interval);
  }
}

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(Bun.env, name);
  else Bun.env[name] = value;
}

const helpers = {
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
      if (original === undefined) Reflect.deleteProperty(globalThis, name);
      else Object.defineProperty(globalThis, name, original);
    }
    stubbedGlobals.clear();
    return vi;
  },
  stubEnv(name: string, value: string | undefined) {
    if (!stubbedEnvs.has(name)) stubbedEnvs.set(name, Bun.env[name]);
    setEnv(name, value);
    return vi;
  },
  unstubAllEnvs() {
    for (const [name, original] of stubbedEnvs) setEnv(name, original);
    stubbedEnvs.clear();
    return vi;
  },
  hoisted<T>(factory: () => T): T {
    return factory();
  },
  mocked<T>(item: T): T {
    return item;
  },
  async waitFor<T>(assertion: () => T | Promise<T>, options: WaitForOptions = {}): Promise<T> {
    const { timeout = 1000, interval = 50 } =
      typeof options === "number" ? { timeout: options } : options;
    const result = await retryUntil(assertion, Date.now() + timeout, interval);
    return result;
  },
};

async function mockModule(dir: string, specifier: string, factory: MockFactory): Promise<void> {
  const resolved = await Bun.resolve(specifier, dir);
  let original: Record<string, unknown> | undefined = undefined;
  const importOriginal = async (): Promise<Record<string, unknown>> => {
    if (original === undefined) {
      const namespace: unknown = await import(resolved);
      original = isObject(namespace) ? copyExports(namespace) : {};
    }
    return original;
  };
  if (factory.length > 0) await importOriginal();
  const exports = await factory(importOriginal);
  await mock.module(resolved, () => exports);
}

export function installVitestCompat(): void {
  Object.assign(vi, helpers);
  Object.assign(expect, {
    fail(message?: string): never {
      return expect.unreachable(message);
    },
  });
  expect.extend({
    toHaveBeenCalledExactlyOnceWith(received: unknown, ...expected: unknown[]) {
      const calls = hasMockCalls(received) ? received.mock.calls : [];
      return {
        pass: calls.length === 1 && this.equals(calls[0], expected),
        message: () =>
          `expected one call with ${this.utils.printExpected(expected)}, got ${this.utils.printReceived(calls)}`,
      };
    },
  });
  Object.assign(globalThis, { __vitestMock: mockModule });
  plugin({
    name: "vitest-compat",
    setup(build) {
      build.onLoad({ filter: /\.test\.tsx?$/u }, async ({ path }) => ({
        contents: hoistMocks(await Bun.file(path).text()),
        loader: path.endsWith("x") ? "tsx" : "ts",
      }));
    },
  });
}

export function resetAfterTest(): void {
  vi.restoreAllMocks();
  vi.useRealTimers();
  helpers.unstubAllGlobals();
  helpers.unstubAllEnvs();
}

export async function wantsDom(testFile: string): Promise<boolean> {
  const source = await Bun.file(testFile).text();
  return !source.includes("@vitest-environment node");
}
