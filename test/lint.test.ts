// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const linter = ["x", "bun@1.4.5-canary.20261120.1", "lint", "--no-script"];

const dir = mkdtempSync(path.join(root, "test/.planted-"));
const uiDir = mkdtempSync(path.join(root, "src/components/ui/.planted-"));
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(uiDir, { recursive: true, force: true });
});

interface Planted {
  command: string;
  args: string[];
  source: string;
  name: string;
  into: string;
}

function plantAndRun({ command, args, source, name, into }: Planted) {
  const file = path.join(into, name);
  writeFileSync(file, source);
  return spawnSync(command, [...args, file], { cwd: root, encoding: "utf8", windowsHide: true });
}

function lint(source: string, name = "planted.ts", into = dir) {
  return plantAndRun({ command: "bun", args: linter, source, name, into });
}

describe("bun lint", () => {
  it("fails on an unused variable", () => {
    expect(lint("export function f() {\n  const unused = 1;\n}\n").status).not.toBe(0);
  });

  it("fails on a hook called conditionally", () => {
    const source =
      'import { useState } from "react";\nexport function C({ on }: { on: boolean }) {\n  if (on) useState(0);\n  return null;\n}\n';
    expect(lint(source, "planted.tsx").status).not.toBe(0);
  });

  const uiSdkImport = 'export { Button } from "@ui-sdk/react/button";\n';

  it("fails on a ui-sdk import outside src/components/ui", () => {
    const result = lint(uiSdkImport);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("no-restricted-imports");
  });

  it("allows ui-sdk imports inside src/components/ui", () => {
    expect(lint(uiSdkImport, "planted.ts", uiDir).status).toBe(0);
  });

  it("passes clean code", () => {
    expect(lint("export const one = 1;\n").status).toBe(0);
  });
});

describe("Biome lint, for what bun lint can't read", () => {
  it("fails on a duplicate CSS property", () => {
    const biome = path.join(root, "node_modules/.bin/biome");
    const css = ".a {\n  color: red;\n  color: blue;\n}\n";
    expect(
      plantAndRun({ command: biome, args: ["lint"], source: css, name: "planted.css", into: dir })
        .status,
    ).not.toBe(0);
  });
});
