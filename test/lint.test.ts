// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const biome = path.join(root, "node_modules/.bin/biome");

// Biome's stdin mode always exits 0 with --write and 1 without, so plant real files.
const dir = mkdtempSync(path.join(root, "test/.planted-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function lint(source: string, name = "planted.ts") {
  const file = path.join(dir, name);
  writeFileSync(file, source);
  return spawnSync(biome, ["lint", file], { cwd: root, encoding: "utf8" });
}

describe("Biome lint", () => {
  it("fails on an unused variable", () => {
    expect(lint("export function f() {\n  const unused = 1;\n}\n").status).not.toBe(0);
  });

  it("fails on a hook called conditionally", () => {
    const source =
      'import { useState } from "react";\nexport function C({ on }: { on: boolean }) {\n  if (on) useState(0);\n  return null;\n}\n';
    expect(lint(source, "planted.tsx").status).not.toBe(0);
  });

  it("passes clean code", () => {
    expect(lint("export const one = 1;\n").status).toBe(0);
  });
});
