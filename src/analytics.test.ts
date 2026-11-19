import { describe, expect, it } from "vitest";
import { beforeSend, scrubRoomIds } from "./analytics";

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

  it("passes a dropped event through", () => {
    expect(beforeSend(null)).toBeNull();
  });
});
