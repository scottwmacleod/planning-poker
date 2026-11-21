import type { Participant } from "../lib/types";

export type PresenceChange = { kind: "joined" | "left"; name: string };

export function presenceChanges(
  prev: Record<string, Participant>,
  next: Record<string, Participant>,
  selfId: string,
): PresenceChange[] {
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
