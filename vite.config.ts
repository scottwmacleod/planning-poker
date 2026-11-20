import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { ROOM_PATH } from "./src/navigation";

// The room page is a lazy chunk (src/roomChunk.ts). On a direct room link, a tiny
// inline script preloads it alongside the main chunk, so the link doesn't wait for
// main to run before fetching the room.
function roomPreload(): Plugin {
  return {
    name: "room-preload",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, { bundle }) {
        const room = Object.values(bundle ?? {}).find(
          (c) => c.type === "chunk" && c.facadeModuleId?.endsWith("/src/pages/Room.tsx"),
        );
        if (room?.type !== "chunk") throw new Error("room-preload: no Room chunk in the build");
        // Already-preloaded imports are harmless: the browser fetches each module once.
        const hrefs = JSON.stringify([room.fileName, ...room.imports].map((f) => `/${f}`));
        return [
          {
            tag: "script",
            // First in <head>: a classic script after the stylesheet waits for it to load.
            injectTo: "head-prepend",
            children: `if(${ROOM_PATH}.test(location.pathname))for(const h of ${hrefs}){const l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.append(l)}`,
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), roomPreload()],
  // NEXT_PUBLIC_ROOM_SERVER_HOST is set in the Vercel project from the Next.js days.
  // Exposing that prefix keeps it working without renaming the variable.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  // Public source maps let PostHog read stack traces from the deployed site. The repo is public.
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    sequence: { shuffle: true },
  },
});
