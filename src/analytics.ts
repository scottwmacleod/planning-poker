import { startPostHog } from "../vendor/sm-core/tooling/analytics/sm-posthog.js";

// Public by design: a PostHog project token can only write events.
const TOKEN = "phc_rKDLfEFrPFjYd4botU7tS9oy4MsNPHbjwsGqTSr4GLB5";

const ROOM_ID = /\/room\/[^/?#]+/g;

/** Replaces a room id in a URL or path with `:id`, so a room link never reaches PostHog. */
export function scrubRoomIds(value: string) {
  return value.replace(ROOM_ID, "/room/:id");
}

interface CaptureResult {
  properties?: Record<string, unknown>;
}

/** PostHog's before_send hook: strips room ids from every URL and path an event carries. */
export function beforeSend<T extends CaptureResult | null>(event: T): T {
  const properties = event?.properties;
  if (!properties) return event;
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" && value.includes("/room/"))
      properties[key] = scrubRoomIds(value);
  }
  return event;
}

export function startAnalytics() {
  startPostHog({
    token: TOKEN,
    product: "planning-poker",
    options: {
      // Participant names are on screen and in inputs: mask all text in recordings and autocapture.
      mask_all_text: true,
      session_recording: { maskAllInputs: true, maskTextSelector: "*" },
      before_send: beforeSend,
    },
  });
}
