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
      {/* No fallback: the page background shows for the moment the room chunk loads. */}
      <Suspense fallback={null}>{roomId ? <Room key={roomId} id={roomId} /> : <Home />}</Suspense>
      {/* Cookieless page counts and web vitals. Each loads one deferred script after render. */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
