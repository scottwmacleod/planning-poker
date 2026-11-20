import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "index.css"), "utf8");

describe("index.css design tokens", () => {
  it("takes every token from the sm-core copy", () => {
    expect(css).toContain('@import "../vendor/sm-core/sm-core.css"');
    expect(css).toContain('@import "../vendor/sm-core/sm-tailwind.css"');
  });

  it("defines no colour, radius or font value of its own", () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/--(color|radius|font|spacing)-[\w-]+:/);
  });

  it("only adds product tokens with the --poker- prefix", () => {
    const defined = [...css.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]);
    for (const name of defined) expect(name).toMatch(/^--poker-/);
  });

  it("draws the shared focus ring in signal-ink", () => {
    expect(css).toMatch(/\.focus-ring:focus-visible/);
    expect(css).toMatch(/outline:\s*2px solid var\(--sm-signal-ink\)/);
    expect(css).toMatch(/outline-offset:\s*2px/);
  });
});

describe("viewport height", () => {
  // Modern Web Guidance `responsive-design`: 100vh is taller than a phone's
  // visible area while its toolbars show, so pages size to dvh instead (#116).
  it("sizes pages to the dynamic viewport, never 100vh", () => {
    const pages = ["pages/Home.tsx", "pages/Room.tsx"].map((f) =>
      readFileSync(path.join(__dirname, f), "utf8"),
    );
    for (const source of pages) {
      expect(source).toContain("min-h-dvh");
      expect(source).not.toMatch(/min-h-screen|h-screen|100vh/);
    }
  });
});
