// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const bun = pkg.packageManager.replace(/^bun@/, "");
const nvmrc = read(".nvmrc").trim();

describe("Bun version", () => {
  it("pins an exact Bun in packageManager, the one place the version lives", () => {
    expect(pkg.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
  });

  it("declares the same minimum in engines, and no Node engine", () => {
    expect(pkg.engines).toEqual({ bun: `>=${bun}` });
  });

  it("has Vercel install the same Bun, because its bundled Bun can't read bun.lock", () => {
    expect(read("vercel.json")).toContain(`bash -s bun-v${bun} &&`);
  });

  it.each(["README.md", "CONTRIBUTING.md"])("%s names the pinned Bun", (file) => {
    expect(read(file)).toContain(`Bun ${bun}`);
  });

  it("keeps no npm lockfile", () => {
    expect(() => read("package-lock.json")).toThrow();
  });
});

describe("Node version", () => {
  it("pins the current LTS, Node 26, in .nvmrc", () => {
    expect(nvmrc).toBe("26");
  });

  it.each(["README.md", "CONTRIBUTING.md"])("%s names the .nvmrc version", (file) => {
    expect(read(file)).toContain(`Node.js ${nvmrc}`);
  });
});

describe("scripts", () => {
  it("call Bun, not npm, npx or node, apart from the sm-core copy check", () => {
    for (const [name, script] of Object.entries<string>(pkg.scripts)) {
      const rest = script.replaceAll("node vendor/sm-core/verify.mjs", "");
      expect(rest, name).not.toMatch(/\b(npm|npx|node)\b/);
    }
  });
});
