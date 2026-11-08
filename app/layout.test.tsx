import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans-var" }),
  Geist_Mono: () => ({ variable: "geist-mono-var" }),
}));
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));

import RootLayout from "./layout";

function renderLayout() {
  return renderToStaticMarkup(
    <RootLayout>
      <main>content</main>
    </RootLayout>,
  );
}

describe("RootLayout", () => {
  it("sets both the Geist and Geist Mono font variables on <html>", () => {
    const html = renderLayout();
    expect(html).toContain("geist-sans-var");
    expect(html).toContain("geist-mono-var");
  });

  it("paints the page with the ground token, not a gray utility", () => {
    const html = renderLayout();
    expect(html).toContain("bg-ground");
    expect(html).not.toContain("bg-gray-950");
  });
});

const css = readFileSync(path.join(__dirname, "globals.css"), "utf8");

describe("globals.css design tokens", () => {
  it.each([
    "ground", "surface", "surface-sunken", "code-bg", "line", "line-strong",
    "control-line", "ink", "ink-body", "ink-muted", "signal", "on-signal",
    "signal-ink", "signal-tint", "wip", "wip-tint", "removed",
  ])("defines the %s colour token", (name) => {
    expect(css).toMatch(new RegExp(`--color-${name}:`));
  });

  it("defines the control-line token with the agreed values", () => {
    expect(css).toContain("#6B716A");
    expect(css).toContain("#7C8178");
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
