import { POSTHOG_TOKEN } from "../lib/types";

// Sends room server errors to PostHog error tracking, beside the app's own errors.
// Logs reach PostHog another way: Cloudflare exports Workers Logs over OTLP
// (`observability.logs` in wrangler.jsonc), so this file only handles exceptions.

const CAPTURE_URL = "https://us.i.posthog.com/i/v0/e/";

// One distinct id for the whole server, with no person profile: errors here
// belong to no visitor, and a room id must never reach PostHog.
const DISTINCT_ID = "planning-poker-room-server";

const ROOM_PATH = /\/parties\/main\/[^/?#\s]+/g;

/** Replaces a room id in a room server path with `:id`. */
export function scrubRoomPath(value: string) {
  return value.replace(ROOM_PATH, "/parties/main/:id");
}

interface StackFrame {
  platform: "node:javascript";
  function: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  in_app: boolean;
}

// V8 frame: "    at fn (file:1:2)", "    at file:1:2" or "    at async fn (file:1:2)".
const FRAME = /^\s*at (?:async )?(?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;

/** Parses a V8 stack into PostHog frames, oldest call first as PostHog expects. */
export function parseStack(stack: string | undefined): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const line of stack?.split("\n") ?? []) {
    const m = FRAME.exec(line);
    if (!m) continue;
    const [, fn, filename = "", lineno = "", colno = ""] = m;
    frames.push({
      platform: "node:javascript",
      function: fn ?? "?",
      filename,
      lineno: Number(lineno),
      colno: Number(colno),
      in_app: !filename.includes("node_modules/"),
    });
  }
  return frames.reverse();
}

/** Builds the `$exception` event PostHog error tracking reads. */
export function exceptionEvent(error: unknown, handler: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    api_key: POSTHOG_TOKEN,
    event: "$exception",
    distinct_id: DISTINCT_ID,
    timestamp: new Date().toISOString(),
    properties: {
      product: "planning-poker",
      handler,
      $lib: "planning-poker-room-server",
      $process_person_profile: false,
      $exception_level: "error",
      $exception_list: [
        {
          type: err.name,
          value: scrubRoomPath(err.message),
          mechanism: { handled: false, synthetic: !(error instanceof Error) },
          stacktrace: { type: "raw", frames: parseStack(err.stack) },
        },
      ],
    },
  };
}

type WaitUntil = (promise: Promise<unknown>) => void;

// At most one report per handler a minute from each isolate, so an error that
// fires on every message can't flood PostHog. The log line still goes out each time.
const REPORT_GAP_MS = 60_000;
const lastReport = new Map<string, number>();

/**
 * Logs an error without its room id and reports it to PostHog in the background.
 * `waitUntil` keeps the send alive after the response goes out, so it adds no
 * latency, and a failed send is dropped: reporting must never break the room.
 */
export function reportError(error: unknown, handler: string, waitUntil: WaitUntil) {
  const summary = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error({ message: "handler failed", handler, error: scrubRoomPath(summary) });

  const now = Date.now();
  if (now - (lastReport.get(handler) ?? -Infinity) < REPORT_GAP_MS) return;
  lastReport.set(handler, now);

  const send = fetch(CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exceptionEvent(error, handler)),
  }).catch(() => {});
  waitUntil(send);
}
