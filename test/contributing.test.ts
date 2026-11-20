// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const triageLabels = [
  ...read("docs/agents/triage-labels.md").matchAll(/^\| `[^`]+` +\| `([^`]+)`/gm),
].map((m) => m[1]);
const issueForms = [
  ".github/ISSUE_TEMPLATE/bug-report.yml",
  ".github/ISSUE_TEMPLATE/feature-request.yml",
];

describe("outside contributions", () => {
  it.each(issueForms)("%s files the issue as needs-triage, one of our triage labels", (form) => {
    const labels = read(form)
      .match(/^labels: \[(.*)\]$/m)?.[1]
      ?.split(",")
      .map((l) => l.trim().replace(/"/g, ""));
    expect(labels).toContain("needs-triage");
    expect(triageLabels).toContain("needs-triage");
  });

  it("turns off blank issues so reporters pick a form", () => {
    expect(read(".github/ISSUE_TEMPLATE/config.yml")).toMatch(/^blank_issues_enabled: false$/m);
  });

  it("README points contributors at CONTRIBUTING.md", () => {
    expect(read("README.md")).toContain("](CONTRIBUTING.md)");
  });

  it("CONTRIBUTING.md states the same definition of done as AGENTS.md", () => {
    const done = "bun run check";
    expect(read("AGENTS.md")).toContain(done);
    expect(read("CONTRIBUTING.md")).toContain(done);
  });

  it("SECURITY.md sends reports to private vulnerability reporting", () => {
    expect(read("SECURITY.md")).toContain(
      "https://github.com/scottwmacleod/planning-poker/security/advisories/new",
    );
  });
});

describe("auto-merge workflow", () => {
  // sm-core's auto-merge.yml only arms PRs from branches in this repo, not forks.
  it("uses sm-core's shared auto-merge, which skips forks and held PRs", () => {
    const caller = read(".github/workflows/auto-merge.yml");
    expect(caller).toContain("uses: scottwmacleod/sm-core/.github/workflows/auto-merge.yml@");
    expect(caller).toContain("hold-label: hold");
  });

  // A merge made with GITHUB_TOKEN starts no workflows on main, so the room
  // server wouldn't deploy. The merge token makes the merge start them.
  it("passes the merge token so a merge deploys the room server", () => {
    expect(read(".github/workflows/auto-merge.yml")).toMatch(
      /merge-token: \$\{\{ secrets\.SM_MERGE_TOKEN \}\}/,
    );
  });
});
