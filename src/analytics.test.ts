import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  beforeSend,
  scrubRoomIds,
  trackRoomCreated,
  trackRoomJoined,
  trackVoteCast,
  trackVotesRevealed,
} from "./analytics";

const { capture } = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("../vendor/sm-core/tooling/analytics/sm-posthog.js", () => ({
  capture,
  startPostHog: vi.fn(),
}));

beforeEach(() => capture.mockClear());

describe("goal events", () => {
  it("sends room_created with no properties", () => {
    trackRoomCreated("abc12345");
    expect(capture).toHaveBeenCalledExactlyOnceWith("room_created");
  });

  it("marks the creator on room_joined, and nobody else", () => {
    trackRoomCreated("mine1234");
    capture.mockClear();
    trackRoomJoined("mine1234", 120.4);
    trackRoomJoined("other999", 80.6);
    expect(capture.mock.calls).toEqual([
      ["room_joined", { is_creator: true, socket_ms: 120 }],
      ["room_joined", { is_creator: false, socket_ms: 81 }],
    ]);
  });

  it("adds load_ms to room_joined only when the visit began on the room", () => {
    window.history.replaceState(null, "", "/room/landed12");
    try {
      trackRoomJoined("landed12", 50);
      expect(capture).toHaveBeenCalledExactlyOnceWith("room_joined", {
        is_creator: false,
        socket_ms: 50,
        load_ms: expect.any(Number),
      });
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("sends only the deck with a vote and only the count on reveal", () => {
    trackVoteCast("tshirt");
    trackVotesRevealed(3);
    expect(capture.mock.calls).toEqual([
      ["vote_cast", { deck: "tshirt" }],
      ["votes_revealed", { voters: 3 }],
    ]);
  });
});

describe("scrubRoomIds", () => {
  it("replaces the room id in a path and a full URL", () => {
    expect(scrubRoomIds("/room/abc12345")).toBe("/room/:id");
    expect(scrubRoomIds("https://example.com/room/abc12345?x=1#y")).toBe(
      "https://example.com/room/:id?x=1#y",
    );
  });

  it("leaves other paths alone", () => {
    expect(scrubRoomIds("/")).toBe("/");
  });
});

describe("beforeSend", () => {
  it("strips room ids from every URL property and keeps the rest", () => {
    const event = beforeSend({
      event: "$pageview",
      properties: {
        $current_url: "https://x.test/room/abc12345",
        $pathname: "/room/abc12345",
        $referrer: "https://x.test/room/zzz99999",
        $screen_width: 390,
        product: "planning-poker",
      },
    });
    expect(event.properties).toEqual({
      $current_url: "https://x.test/room/:id",
      $pathname: "/room/:id",
      $referrer: "https://x.test/room/:id",
      $screen_width: 390,
      product: "planning-poker",
    });
  });

  it("strips room ids from nested exception frames", () => {
    const event = beforeSend({
      properties: {
        $exception_list: [
          {
            type: "Error",
            value: "boom at /room/abc12345",
            stacktrace: {
              frames: [{ filename: "https://x.test/room/abc12345/app.js", lineno: 3 }],
            },
          },
        ],
      },
    });
    expect(event.properties).toEqual({
      $exception_list: [
        {
          type: "Error",
          value: "boom at /room/:id",
          stacktrace: { frames: [{ filename: "https://x.test/room/:id/app.js", lineno: 3 }] },
        },
      ],
    });
  });

  it("passes a dropped event through", () => {
    expect(beforeSend(null)).toBeNull();
  });
});
