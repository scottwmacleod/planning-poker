// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const workflows = path.join(root, ".github/workflows");
const read = (file: string) => readFileSync(path.join(workflows, file), "utf8");

describe("CI workflows", () => {
  it.each(readdirSync(workflows))("%s calls only this repo's own reusable workflows", (file) => {
    for (const [, target] of read(file).matchAll(/^\s+uses: (\S+\.yml)\S*$/gmu)) {
      expect(target).toMatch(/^\.\/\.github\/workflows\/reusable-[\w-]+\.yml$/u);
    }
  });

  it("requires the room server bundle in the ci check", () => {
    const ci = read("ci.yml");
    expect(ci).toMatch(/needs: \[web, budgets, room-server\]/);
    expect(ci).toContain("bun --bun x wrangler deploy --dry-run");
  });

  it("deploys the room server from main only, after ci passes", () => {
    const deploy = read("ci.yml").split("deploy-worker:")[1];
    expect(deploy).toContain("needs: ci");
    expect(deploy).toContain("github.ref == 'refs/heads/main'");
    expect(deploy).toContain("bun --bun x wrangler deploy\n");
  });
});
