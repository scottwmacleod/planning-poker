import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exceptionEvent, parseStack, reportError, scrubRoomPath } from "./telemetry";

const STACK = `Error: boom
    at PokerRoom.handleMessage (index.js:120:11)
    at async index.js:300:5
    at Object.fetch (node_modules/partyserver/dist/index.js:40:2)`;

describe("parseStack", () => {
  it("lists frames oldest call first", () => {
    expect(parseStack(STACK)).toEqual<unknown>([
      expect.objectContaining({
        function: "Object.fetch",
        filename: "node_modules/partyserver/dist/index.js",
        in_app: false,
      }),
      expect.objectContaining({ function: "?", filename: "index.js", lineno: 300, colno: 5 }),
      expect.objectContaining({
        function: "PokerRoom.handleMessage",
        filename: "index.js",
        lineno: 120,
        colno: 11,
        in_app: true,
        platform: "node:javascript",
      }),
    ]);
  });

  it("copes with no stack", () => {
    expect(parseStack(undefined)).toEqual([]);
  });
});

describe("exceptionEvent", () => {
  it("builds an error tracking event for planning-poker with no person profile", () => {
    const error = new TypeError("bad thing");
    const event = exceptionEvent(error, "fetch");
    expect(event).toMatchObject({
      event: "$exception",
      properties: {
        product: "planning-poker",
        handler: "fetch",
        $process_person_profile: false,
        $exception_list: [{ type: "TypeError", value: "bad thing", mechanism: { handled: false } }],
      },
    });
  });

  it("never carries a room id", () => {
    const event = exceptionEvent(new Error("no room at /parties/main/abc123?x=1"), "fetch");
    expect(JSON.stringify(event)).not.toContain("abc123");
  });

  it("wraps a thrown non-error", () => {
    const event = exceptionEvent("plain string", "fetch");
    expect(event.properties.$exception_list[0]).toMatchObject({
      type: "Error",
      value: "plain string",
      mechanism: { synthetic: true },
    });
  });
});

describe("scrubRoomPath", () => {
  it("replaces the room id", () => {
    expect(scrubRoomPath("/parties/main/a1b2c3")).toBe("/parties/main/:id");
  });
});

describe("reportError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("posts to PostHog in the background", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetchMock);
    const waitUntil = vi.fn();
    reportError(new Error("boom"), "test-posts", waitUntil);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://us.i.posthog.com/i/v0/e/",
      expect.objectContaining({ method: "POST" }),
    );
    await expect(waitUntil.mock.calls[0]![0]).resolves.toBeInstanceOf(Response);
  });

  it("drops a failed send", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const waitUntil = vi.fn();
    reportError(new Error("boom"), "test-drops", waitUntil);
    await expect(waitUntil.mock.calls[0]![0]).resolves.toBeUndefined();
  });

  it("logs without the room id", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null)));
    reportError(new Error("lost /parties/main/secret-room"), "test-logs", vi.fn());
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("secret-room");
  });

  it("reports a repeating error once a minute", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetchMock);
    for (let i = 0; i < 5; i++) reportError(new Error("boom"), "test-gap", vi.fn());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(60_000);
    reportError(new Error("boom"), "test-gap", vi.fn());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
