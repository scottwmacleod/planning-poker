import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
