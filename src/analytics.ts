import { type Deck, POSTHOG_TOKEN } from "../lib/types";
import { capture, startPostHog } from "../vendor/base/tooling/analytics/sm-posthog.js";
import { landedOnRoom } from "./navigation";

const ROOM_ID = /\/room\/[^/?#]+/g;

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

export function beforeSend<T extends CaptureResult | null>(event: T): T {
  if (event?.properties) event.properties = scrubDeep(event.properties) as Record<string, unknown>;
  return event;
}

export function startAnalytics() {
  startPostHog({
    token: POSTHOG_TOKEN,
    product: "planning-poker",
    options: {
      mask_all_text: true,
      session_recording: { maskAllInputs: true, maskTextSelector: "*" },
      before_send: beforeSend,
    },
  });
}

const createdRooms = new Set<string>();

export function trackRoomCreated(roomId: string) {
  createdRooms.add(roomId);
  capture("room_created");
}

export function trackRoomJoined(roomId: string, socketMs: number) {
  capture("room_joined", {
    is_creator: createdRooms.has(roomId),
    socket_ms: Math.round(socketMs),
    ...(landedOnRoom() ? { load_ms: Math.round(performance.now()) } : {}),
  });
}

export function trackVoteCast(deck: Deck) {
  capture("vote_cast", { deck });
}

export function trackVotesRevealed(voters: number) {
  capture("votes_revealed", { voters });
}
