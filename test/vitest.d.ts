/// <reference types="bun" />

type JestDomMatchers = import("@testing-library/jest-dom/matchers").TestingLibraryMatchers<
  unknown,
  void
>;

declare module "bun:test" {
  interface Matchers<T = unknown> extends JestDomMatchers {
    toHaveBeenCalledExactlyOnceWith(...expected: unknown[]): void;
  }
}

declare module "vitest" {
  export * from "bun:test";

  import type { expect as bunExpect, vi as bunVi, Mock } from "bun:test";

  type WaitForOptions = number | { timeout?: number; interval?: number };

  export const expect: typeof bunExpect & { fail(message?: string): never };

  export const vi: Omit<typeof bunVi, "mock"> & {
    stubGlobal(name: PropertyKey, value: unknown): typeof vi;
    unstubAllGlobals(): typeof vi;
    stubEnv(name: string, value: string | undefined): typeof vi;
    unstubAllEnvs(): typeof vi;
    mock(path: string, factory?: (importOriginal: <T = unknown>() => Promise<T>) => unknown): void;
    hoisted<T>(factory: () => T): T;
    mocked<T>(item: T): T extends (...args: never[]) => unknown ? Mock<T> : T;
    waitFor<T>(callback: () => T | Promise<T>, options?: WaitForOptions): Promise<T>;
  };
}
