import { describe, expect, it } from "vitest";
import { roomIdFrom, roomPath } from "./navigation";

describe("room paths", () => {
  it.each(["abc12345", "a b", "a/b", "q?x#y"])("round-trips %s", (id) => {
    expect(roomIdFrom(roomPath(id))).toBe(id);
  });

  it("ignores paths that aren't a room", () => {
    expect(roomIdFrom("/")).toBeNull();
    expect(roomIdFrom("/room/")).toBeNull();
    expect(roomIdFrom("/room/a/b")).toBeNull();
  });
});
