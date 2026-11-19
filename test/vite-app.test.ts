// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("index.html", () => {
  const html = read("index.html");

  it("keeps the title, description and language", () => {
    expect(html).toContain('<html lang="en"');
    expect(html).toContain("<title>Planning Poker</title>");
    expect(html).toContain(
      '<meta name="description" content="Real-time planning poker for agile teams"',
    );
  });

  it("links the favicon, SVG icon and apple-touch icon from public/", () => {
    for (const href of ["/favicon.ico", "/icon.svg", "/apple-icon.png"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it("paints the ground colour before the app mounts", () => {
    expect(html).toMatch(/<body class="[^"]*bg-ground/);
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
  });
});

describe("Vercel config", () => {
  const vercel = JSON.parse(read("vercel.json"));

  it("serves index.html for every path, so a hard refresh on /room/:id loads the room", () => {
    expect(vercel.rewrites).toContainEqual({ source: "/(.*)", destination: "/index.html" });
  });

  it("caches Vite's hashed assets for a year", () => {
    const assets = vercel.headers.find((h: { source: string }) => h.source === "/assets/(.*)");
    expect(assets.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    });
  });
});

describe("self-hosted fonts", () => {
  it("loads Geist and Geist Mono from @fontsource, not Google", () => {
    const css = read("src/index.css");
    expect(css).toContain('@import "@fontsource/geist/');
    expect(css).toContain('@import "@fontsource/geist-mono/');
    expect(read("index.html")).not.toContain("fonts.googleapis.com");
  });
});
