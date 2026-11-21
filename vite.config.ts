import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

import { ROOM_PATH } from "./src/navigation";

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
        const hrefs = JSON.stringify([room.fileName, ...room.imports].map((f) => `/${f}`));
        return [
          {
            tag: "script",
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
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    sequence: { shuffle: true },
  },
});
