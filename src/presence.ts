import type { Participant } from "../lib/types";

export type PresenceChange = { kind: "joined" | "left"; name: string };

/**
 * Who joined or left between two snapshots of a room's participants, leaving
 * out `selfId`. A dropped connection that reconnects shows as left, then joined.
 */
export function presenceChanges(
  prev: Record<string, Participant>,
  next: Record<string, Participant>,
  selfId: string,
): PresenceChange[] {
  // Everyone in `from` but not in `to`, other than yourself.
  const missing = (
    from: Record<string, Participant>,
    to: Record<string, Participant>,
    kind: PresenceChange["kind"],
  ) =>
    Object.values(from)
      .filter((p) => p.id !== selfId && !Object.hasOwn(to, p.id))
      .map((p) => ({ kind, name: p.name }));

  return [...missing(prev, next, "left"), ...missing(next, prev, "joined")];
}
