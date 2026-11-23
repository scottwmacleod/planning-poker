import { useCallback, useEffect, useRef, useState } from "react";

import type { Participant } from "../../lib/types";
import type { CssVars } from "../cssVars";
import { type PresenceChange, presenceChanges } from "../presence";

const NOTICE_MS = 4000;
const noticeTiming: CssVars = { "--notice-ms": `${NOTICE_MS}ms` };

type Notice = PresenceChange & { id: number };

function NoticeLine({ notice, onExpire }: { notice: Notice; onExpire: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onExpire(notice.id), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice.id, onExpire]);

  return (
    <p
      className="notice-out rounded-1 border border-line bg-ground px-3 py-1 font-mono text-sm text-ink-muted"
      style={noticeTiming}
    >
      <span className="text-ink">{notice.name}</span> {notice.kind}
    </p>
  );
}

export default function PresenceNotices({
  participants,
  selfId,
}: {
  participants: Record<string, Participant>;
  selfId: string;
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const previous = useRef<Record<string, Participant> | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    const prev = previous.current;
    previous.current = participants;
    if (!prev) return;
    const changes = presenceChanges(prev, participants, selfId);
    if (changes.length > 0) {
      setNotices((current) => [
        ...current,
        ...changes.map((c) => ({ ...c, id: nextId.current++ })),
      ]);
    }
  }, [participants, selfId]);

  const expire = useCallback((id: number) => {
    setNotices((current) => current.filter((n) => n.id !== id));
  }, []);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Who joined or left"
      className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-1 px-4"
    >
      {notices.map((n) => (
        <NoticeLine key={n.id} notice={n} onExpire={expire} />
      ))}
    </div>
  );
}
