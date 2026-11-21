import { describe, expect, it } from "vitest";

import type { Participant } from "../lib/types";
import { presenceChanges } from "./presence";

function people(...names: string[]): Record<string, Participant> {
  return Object.fromEntries(
    names.map((name) => [name, { id: name, name, isSpectator: false, vote: null }]),
  );
}

describe("presenceChanges", () => {
  it("names who left and who joined", () => {
    expect(presenceChanges(people("me", "Bob"), people("me", "Carol"), "me")).toEqual([
      { kind: "left", name: "Bob" },
      { kind: "joined", name: "Carol" },
    ]);
  });

  it("ignores votes, renames and observer changes", () => {
    const next = people("me", "Bob");
    next.Bob = { ...next.Bob!, name: "Robert", vote: "5", isSpectator: true };
    expect(presenceChanges(people("me", "Bob"), next, "me")).toEqual([]);
  });

  it("never reports yourself", () => {
    expect(presenceChanges(people(), people("me"), "me")).toEqual([]);
    expect(presenceChanges(people("me"), people(), "me")).toEqual([]);
  });
});
