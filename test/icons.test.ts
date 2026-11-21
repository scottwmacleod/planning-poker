import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.join(__dirname, "..");
const read = (f: string) => readFileSync(path.join(root, f));

describe("site icons", () => {
  it.each([
    ["public/favicon.svg", "vendor/sm-core/logos/planning-poker-favicon.svg"],
    ["public/favicon-32.png", "vendor/sm-core/logos/planning-poker-favicon-32.png"],
    ["public/apple-touch-icon.png", "vendor/sm-core/logos/planning-poker-apple-touch-icon.png"],
  ])("%s is the sm-core copy", (icon, source) => {
    expect(read(icon).equals(read(source))).toBe(true);
  });

  it("drops the old >_ icons", () => {
    for (const old of ["icon.svg", "apple-icon.png", "favicon.ico"]) {
      expect(existsSync(path.join(root, "public", old))).toBe(false);
    }
  });
});
