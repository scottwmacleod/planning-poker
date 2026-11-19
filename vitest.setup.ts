import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Tests run shuffled, so nothing one test changes may leak into the next.
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (typeof localStorage !== "undefined") localStorage.clear();
});
