import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const read = (f: string) => readFileSync(path.join(__dirname, f));

describe("site icons", () => {
  const svg = read("icon.svg").toString("utf8");

  it("icon.svg uses the redesign palette, not the old indigo", () => {
    expect(svg).not.toContain("#4f46e5");
    expect(svg).toContain("#c5f04a");
    expect(svg).toContain("#0b0c0b");
  });

  it("ships a 180x180 PNG apple-icon", () => {
    const file = path.join(__dirname, "apple-icon.png");
    expect(existsSync(file)).toBe(true);
    const png = readFileSync(file);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(180);
    expect(png.readUInt32BE(20)).toBe(180);
  });

  it("favicon.ico holds 16, 32 and 48 px frames", () => {
    const ico = read("favicon.ico");
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16]);
    expect(sizes).toEqual(expect.arrayContaining([16, 32, 48]));
  });
});
