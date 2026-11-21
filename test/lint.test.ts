// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const linter = ["x", "bun@1.4.5-canary.20261120.1", "lint", "--no-script"];
const uiSdkImport = 'export { Button } from "@ui-sdk/react/button";\n';

interface Run {
  failed: boolean;
  output: string;
}

async function run(command: string, args: string[]): Promise<Run> {
  const child = Bun.spawn([command, ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { failed: code !== 0, output: `${stdout}${stderr}` };
}

function planted(into: string, name: string) {
  return path.relative(root, path.join(into, name));
}

describe("lint config", () => {
  const state = {
    dir: "",
    uiDir: "",
    bunLint: { failed: false, output: "" } as Run,
    biome: { failed: false, output: "" } as Run,
  };

  const sources = {
    unused: "export function f() {\n  const unused = 1;\n}\n",
    hook: 'import { useState } from "react";\nexport function C({ on }: { on: boolean }) {\n  if (on) useState(0);\n  return null;\n}\n',
    clean: "export const one = 1;\n",
    css: ".a {\n  color: red;\n  color: blue;\n}\n",
  };

  function findings(file: string) {
    return state.bunLint.output.split("\n").filter((line) => line.startsWith(`${file}:`));
  }

  beforeAll(async () => {
    state.dir = await mkdtemp(path.join(root, "test/.planted-"));
    state.uiDir = await mkdtemp(path.join(root, "src/components/ui/.planted-"));
    await Promise.all([
      writeFile(path.join(state.dir, "unused.ts"), sources.unused),
      writeFile(path.join(state.dir, "hook.tsx"), sources.hook),
      writeFile(path.join(state.dir, "sdk.ts"), uiSdkImport),
      writeFile(path.join(state.uiDir, "sdk.ts"), uiSdkImport),
      writeFile(path.join(state.dir, "clean.ts"), sources.clean),
      writeFile(path.join(state.dir, "duplicate.css"), sources.css),
    ]);
    [state.bunLint, state.biome] = await Promise.all([
      run("bun", [...linter, state.dir, state.uiDir]),
      run(path.join(root, "node_modules/.bin/biome"), [
        "lint",
        planted(state.dir, "duplicate.css"),
      ]),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      rm(state.dir, { recursive: true, force: true }),
      rm(state.uiDir, { recursive: true, force: true }),
    ]);
  });

  it("bun lint fails on an unused variable", () => {
    expect(findings(planted(state.dir, "unused.ts")).join("\n")).toContain("no-unused-vars");
  });

  it("bun lint fails on a hook called conditionally", () => {
    expect(findings(planted(state.dir, "hook.tsx")).join("\n")).toContain("rules-of-hooks");
  });

  it("bun lint fails on a ui-sdk import outside src/components/ui", () => {
    expect(findings(planted(state.dir, "sdk.ts")).join("\n")).toContain("no-restricted-imports");
  });

  it("bun lint allows ui-sdk imports inside src/components/ui", () => {
    expect(findings(planted(state.uiDir, "sdk.ts"))).toStrictEqual([]);
  });

  it("bun lint passes clean code", () => {
    expect(findings(planted(state.dir, "clean.ts"))).toStrictEqual([]);
  });

  it("biome fails on a duplicate CSS property, which bun lint can't read", () => {
    expect(state.biome.failed).toBe(true);
    expect(state.biome.output).toContain("noDuplicateProperties");
  });
});
