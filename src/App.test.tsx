import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./pages/Room", () => ({ default: ({ id }: { id: string }) => <p>room {id}</p> }));
vi.mock("nanoid", () => ({ nanoid: () => "newroom1" }));

import App from "./App";

afterEach(() => window.history.replaceState(null, "", "/"));

describe("App routes", () => {
  it("shows the home page at /", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /create room/ })).toBeInTheDocument();
  });

  it("shows the room for /room/:id on a direct load", async () => {
    window.history.replaceState(null, "", "/room/abc12345");
    render(<App />);
    expect(await screen.findByText("room abc12345")).toBeInTheDocument();
  });

  it("moves to the new room without a page load when creating one", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /create room/ }));
    expect(window.location.pathname).toBe("/room/newroom1");
    expect(await screen.findByText("room newroom1")).toBeInTheDocument();
  });

  it("follows the back button", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /create room/ }));
    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("button", { name: /create room/ })).toBeInTheDocument();
  });

  it("sends unknown paths to the home page", () => {
    window.history.replaceState(null, "", "/nope");
    render(<App />);
    expect(screen.getByRole("button", { name: /create room/ })).toBeInTheDocument();
  });
});

describe("Vercel insights", () => {
  it("loads Web Analytics and Speed Insights", () => {
    render(<App />);
    const scripts = [...document.querySelectorAll("script")].map((s) => s.src);
    expect(scripts.some((src) => src.includes("insights/script"))).toBe(true);
    expect(scripts.some((src) => src.includes("speed-insights/script"))).toBe(true);
  });
});
