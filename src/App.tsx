import { Analytics } from "@vercel/analytics/react";
import { roomIdFrom, usePathname } from "./navigation";
import Home from "./pages/Home";
import Room from "./pages/Room";

export default function App() {
  const roomId = roomIdFrom(usePathname());
  return (
    <>
      {roomId ? <Room key={roomId} id={roomId} /> : <Home />}
      <Analytics />
    </>
  );
}
