import { afterEach, describe, expect, it, vi } from "vitest";

import { navigate, roomIdFrom, roomPath } from "./navigation";

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

describe("navigate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "startViewTransition");
    window.history.replaceState(null, "", "/");
  });

  function stub(reducedMotion: boolean) {
    const transition = vi.fn((update: () => void) => update());
    Object.assign(document, { startViewTransition: transition });
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: reducedMotion && q.includes("reduce"),
    }));
    return transition;
  }

  it("cross-fades through a View Transition when motion is welcome", () => {
    const transition = stub(false);
    navigate("/room/abc");
    expect(transition).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/room/abc");
  });

  it("skips the transition under reduced motion", () => {
    const transition = stub(true);
    navigate("/room/abc");
    expect(transition).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/room/abc");
  });

  it("still navigates where View Transitions don't exist", () => {
    navigate("/room/xyz");
    expect(window.location.pathname).toBe("/room/xyz");
  });
});
