/// <reference types="bun" />

import type { Mock, expect as bunExpect, vi as bunVi } from "bun:test";

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

type WaitForOptions = number | { timeout?: number; interval?: number };
type Mocked<T> = T extends (...args: never[]) => unknown ? Mock<T> : T;
type MatcherResult = ReturnType<typeof bunExpect.extend>;
type Settled<M> = {
  [K in keyof M]: M[K] extends (...args: infer A) => MatcherResult
    ? (...args: A) => Promise<MatcherResult>
    : Settled<M[K]>;
};

declare module "bun:test" {
  interface Matchers<T = unknown> extends TestingLibraryMatchers<unknown, MatcherResult> {
    resolves: Settled<Matchers<Awaited<T>>>;
    rejects: Settled<Matchers>;
    toHaveBeenCalledExactlyOnceWith: (...expected: unknown[]) => MatcherResult;
  }
}

export * from "bun:test";

export declare const expect: typeof bunExpect & { fail: (message?: string) => never };

export declare const vi: Omit<typeof bunVi, "mock"> & {
  stubGlobal: (name: PropertyKey, value: unknown) => typeof vi;
  unstubAllGlobals: () => typeof vi;
  stubEnv: (name: string, value: string | undefined) => typeof vi;
  unstubAllEnvs: () => typeof vi;
  mock: (
    path: string,
    factory?: (importOriginal: <T = unknown>() => Promise<T>) => unknown,
  ) => void;
  hoisted: <T>(factory: () => T) => T;
  mocked: <T>(item: T) => Mocked<T>;
  waitFor: <T>(callback: () => T | Promise<T>, options?: WaitForOptions) => Promise<T>;
};
