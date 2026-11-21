import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

import { trackRoomCreated } from "../analytics";
import { Button, Field } from "../components/ui";
import { navigate, roomPath } from "../navigation";
import { prefetchRoom } from "../roomChunk";

function usePrefetchRoomWhenIdle() {
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(prefetchRoom, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(prefetchRoom, 1000);
    return () => clearTimeout(id);
  }, []);
}

function goToRoom(id: string) {
  prefetchRoom().then(() => navigate(roomPath(id)));
}

export default function Home() {
  const [joinId, setJoinId] = useState("");
  const canJoin = joinId.trim() !== "";
  usePrefetchRoomWhenIdle();

  function createRoom() {
    const id = nanoid(8);
    trackRoomCreated(id);
    goToRoom(id);
  }

  function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    const id = joinId.trim();
    if (id) goToRoom(id);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ground text-ink">
      <main className="flex flex-1 flex-col items-center justify-center gap-space-7 p-space-6">
        <div className="text-center">
          <h1 className="mb-space-2 text-4xl">
            <span className="sm-mark">
              planning-poker
              <span className="sm-cursor" aria-hidden="true" />
            </span>
          </h1>
          <p className="font-mono text-ink-muted">estimate together, in real time</p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-space-5">
          <Button
            variant="signal"
            size="lg"
            onClick={createRoom}
            onPointerEnter={prefetchRoom}
            onFocus={prefetchRoom}
            className="w-full"
          >
            create room <span aria-hidden="true">→</span>
          </Button>

          <div className="flex items-center gap-space-4">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-sm text-ink-muted">or join one that exists</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={joinRoom} className="flex flex-col gap-space-3">
            <Field
              id="room-id"
              label="room id"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onFocus={prefetchRoom}
              placeholder="e.g. abc12345"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="go"
            />
            <Button type="submit" variant="signal" size="md" disabled={!canJoin} className="w-full">
              join room
            </Button>
          </form>
        </div>
      </main>

      <footer className="p-space-5 text-center">
        <a
          className="sm-credit"
          href="https://scottmacleod.co"
          target="_blank"
          rel="noopener"
          aria-label="Shipped by sm_, scottmacleod.co (opens in a new tab)"
        >
          shipped by{" "}
          <span className="sm-mark">
            sm
            <span className="sm-cursor" aria-hidden="true" />
          </span>
        </a>
      </footer>
    </div>
  );
}
