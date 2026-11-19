import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "index.css"), "utf8");

describe("index.css design tokens", () => {
  it.each([
    "ground",
    "surface",
    "surface-sunken",
    "code-bg",
    "line",
    "line-strong",
    "control-line",
    "ink",
    "ink-body",
    "ink-muted",
    "signal",
    "on-signal",
    "signal-ink",
    "signal-tint",
    "wip",
    "wip-tint",
    "removed",
  ])("defines the %s colour token", (name) => {
    expect(css).toMatch(new RegExp(`--color-${name}:`));
  });

  it("defines the control-line token with the agreed values", () => {
    expect(css).toContain("#6b716a");
    expect(css).toContain("#7c8178");
  });

  it("uses a 2px radius and a light theme under prefers-color-scheme", () => {
    expect(css).toMatch(/--radius[^:]*:\s*2px/);
    expect(css).toContain("prefers-color-scheme: light");
  });

  it("defines the shared focus ring", () => {
    expect(css).toMatch(/\.focus-ring:focus-visible/);
    expect(css).toMatch(/outline:\s*2px solid var\(--color-signal-ink\)/);
    expect(css).toMatch(/outline-offset:\s*2px/);
  });

  it("no longer uses Arial for the body", () => {
    expect(css).not.toContain("Arial");
  });
});
