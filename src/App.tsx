import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Suspense } from "react";

import { roomIdFrom, usePathname } from "./navigation";
import Home from "./pages/Home";
import { Room } from "./roomChunk";

export default function App() {
  const roomId = roomIdFrom(usePathname());
  return (
    <>
      <Suspense fallback={null}>{roomId ? <Room key={roomId} id={roomId} /> : <Home />}</Suspense>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
