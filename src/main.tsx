import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startAnalytics } from "./analytics";
import { roomIdFrom } from "./navigation";
import { prefetchRoom } from "./roomChunk";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

startAnalytics();

const ready = roomIdFrom(window.location.pathname) ? prefetchRoom() : null;

const app = createRoot(root);
const render = () =>
  app.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
if (ready) ready.then(render);
else render();
