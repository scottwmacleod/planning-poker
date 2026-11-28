// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "..", "src/index.css"), "utf8");

describe("motion styles in index.css", () => {
  it("eases with the base copy's ease-out, not a second copy", () => {
    expect(css).not.toMatch(/--ease-out:/);
    expect(css).toContain("var(--sm-ease-out)");
  });

  it("gives .press a 160ms scale-down on :active", () => {
    expect(css).toMatch(/\.press:active:not\(:disabled\)\s*{[^}]*transform:\s*scale\(0\.97\)/);
    expect(css).toMatch(/\.press\s*{[^}]*transition:[^;}]*transform 160ms var\(--sm-ease-out\)/);
  });

  it("grows distribution bars with scaleX from the left, not width", () => {
    expect(css).toMatch(/@keyframes bar-grow\s*{\s*from\s*{\s*transform:\s*scaleX\(0\)/);
    expect(css).toMatch(/\.bar-grow\s*{[^}]*transform-origin:\s*left/);
  });

  it("leaves the cursor blink to the base copy's .sm-cursor", () => {
    expect(css).not.toMatch(/cursor-blink|@keyframes blink/);
  });

  const optIn = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));

  it("never cancels motion under reduced motion, so a stronger selector can't slip past", () => {
    expect(css).not.toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it("only scales, grows or animates inside the no-preference block", () => {
    const outside = css.replace(optIn, "");
    expect(outside).not.toMatch(/scale\(0\.97\)/);
    expect(outside).not.toMatch(/animation:/);
    expect(outside).not.toMatch(/transition:[^;]*transform/);
    for (const rule of [".deal-in", ".bar-grow", ".notice-out", ".press:active:not(:disabled)"]) {
      expect(optIn).toContain(rule);
    }
  });
});
