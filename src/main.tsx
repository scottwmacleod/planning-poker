import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startAnalytics } from "./analytics";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

startAnalytics();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
