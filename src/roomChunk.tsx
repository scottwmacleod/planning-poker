import { type ComponentProps, lazy } from "react";

type RoomPage = typeof import("./pages/Room").default;

let loaded: RoomPage | null = null;
let loading: Promise<{ default: RoomPage }> | null = null;

function loadRoom() {
  loading ??= import("./pages/Room").then(
    (m) => {
      loaded = m.default;
      return m;
    },
    (error) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}

const LazyRoom = lazy(loadRoom);

export function Room(props: ComponentProps<RoomPage>) {
  const Page = loaded ?? LazyRoom;
  return <Page {...props} />;
}

export function prefetchRoom() {
  return loadRoom().then(
    () => {},
    () => {},
  );
}
