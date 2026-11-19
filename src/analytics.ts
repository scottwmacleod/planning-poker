import { startPostHog } from "../vendor/sm-core/tooling/analytics/sm-posthog.js";

// Public by design: a PostHog project token can only write events.
const TOKEN = "phc_rKDLfEFrPFjYd4botU7tS9oy4MsNPHbjwsGqTSr4GLB5";

const ROOM_ID = /\/room\/[^/?#]+/g;

/** Replaces a room id in a URL or path with `:id`, so a room link never reaches PostHog. */
export function scrubRoomIds(value: string) {
  return value.replace(ROOM_ID, "/room/:id");
}

function scrubDeep(value: unknown): unknown {
  if (typeof value === "string") return value.includes("/room/") ? scrubRoomIds(value) : value;
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubDeep(v)]));
  return value;
}

interface CaptureResult {
  properties?: Record<string, unknown>;
}

/**
 * PostHog's before_send hook: strips room ids from every URL and path an event carries,
 * including the nested stack frames of `$exception` events.
 */
export function beforeSend<T extends CaptureResult | null>(event: T): T {
  if (event?.properties) event.properties = scrubDeep(event.properties) as Record<string, unknown>;
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
