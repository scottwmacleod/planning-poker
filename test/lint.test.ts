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

function reported(file: string, rule: string) {
  return new RegExp(`^(?=[^\\n]*${RegExp.escape(file)}:)[^\\n]*${RegExp.escape(rule)}`, "mu");
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
      run("bun", [
        ...linter,
        ...["unused.ts", "hook.tsx", "sdk.ts", "clean.ts"].map((name) =>
          path.join(state.dir, name),
        ),
        path.join(state.uiDir, "sdk.ts"),
      ]),
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
    expect(state.bunLint.output).toMatch(
      reported(planted(state.dir, "unused.ts"), "no-unused-vars"),
    );
  });

  it("bun lint fails on a hook called conditionally", () => {
    expect(state.bunLint.output).toMatch(
      reported(planted(state.dir, "hook.tsx"), "rules-of-hooks"),
    );
  });

  it("bun lint fails on a ui-sdk import outside src/components/ui", () => {
    expect(state.bunLint.output).toMatch(
      reported(planted(state.dir, "sdk.ts"), "no-restricted-imports"),
    );
  });

  it("bun lint allows ui-sdk imports inside src/components/ui", () => {
    expect(state.bunLint.output).not.toContain(planted(state.uiDir, "sdk.ts"));
  });

  it("bun lint passes clean code", () => {
    expect(state.bunLint.output).not.toContain(planted(state.dir, "clean.ts"));
  });

  it("biome fails on a duplicate CSS property, which bun lint can't read", () => {
    expect(state.biome.failed).toBe(true);
    expect(state.biome.output).toContain("noDuplicateProperties");
  });
});
