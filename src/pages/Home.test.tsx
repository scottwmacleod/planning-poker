import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
vi.mock("../navigation", async (original) => ({
  ...(await original<typeof import("../navigation")>()),
  navigate: push,
}));
vi.mock("nanoid", () => ({ nanoid: () => "newroom1" }));
const prefetchRoom = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("../roomChunk", () => ({ prefetchRoom }));

import { expectNoAxeViolations } from "../../test/axe";
import Home from "./Home";

beforeEach(() => {
  push.mockClear();
  prefetchRoom.mockClear();
});

describe("Home page", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Home />);
    await expectNoAxeViolations(container);
  });

  it("stops phones capitalising or correcting the case-sensitive room id", () => {
    render(<Home />);
    const field = screen.getByRole("textbox", { name: "room id" });
    expect(field).toHaveAttribute("autocapitalize", "none");
    expect(field).toHaveAttribute("autocorrect", "off");
    expect(field).toHaveAttribute("spellcheck", "false");
    expect(field).toHaveAttribute("autocomplete", "off");
    expect(field).toHaveAttribute("enterkeyhint", "go");
  });

  it("titles the page with the planning-poker mark and its sm_ cursor", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1, name: "planning-poker" });
    const mark = h1.querySelector(".sm-mark");
    expect(mark).toHaveTextContent("planning-poker");
    expect(mark?.querySelector('.sm-cursor[aria-hidden="true"]')).not.toBeNull();
  });

  it("gives create room press feedback", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "create room" })).toHaveClass("press");
  });

  it('creates a room from the lime "create room" button', async () => {
    render(<Home />);
    const btn = screen.getByRole("button", { name: "create room" });
    expect(btn).toHaveTextContent("create room →");
    expect(btn).toHaveClass("bg-signal", "text-on-signal");
    await userEvent.click(btn);
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/room/newroom1"));
  });

  it("shows join room as a disabled outline button until an ID is typed", () => {
    render(<Home />);
    const join = screen.getByRole("button", { name: "join room" });
    expect(join).toBeDisabled();
    expect(join).toHaveClass("disabled:bg-transparent", "disabled:border-control-line");
  });

  it("turns join room lime and enabled once an ID is typed, then joins", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText("room id"), " abc123 ");
    const join = screen.getByRole("button", { name: "join room" });
    expect(join).toBeEnabled();
    expect(join).toHaveClass("bg-signal", "text-on-signal");
    await userEvent.click(join);
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/room/abc123"));
  });

  it("treats a whitespace-only ID as empty", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText("room id"), "   ");
    const join = screen.getByRole("button", { name: "join room" });
    expect(join).toBeDisabled();
  });

  it("styles the room ID input with the surface fill, hairline border and shared focus ring", () => {
    render(<Home />);
    const input = screen.getByLabelText("room id");
    expect(input).toHaveClass("bg-surface", "border-control-line", "rounded-1", "focus-ring");
  });

  it("puts the sm_ credit in the footer, opening scottmacleod.co in a new tab", () => {
    render(<Home />);
    const link = screen.getByRole("link", {
      name: "Shipped by sm_, scottmacleod.co (opens in a new tab)",
    });
    expect(link).toHaveClass("sm-credit");
    expect(link).toHaveAttribute("href", "https://scottmacleod.co");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(link).toHaveTextContent("shipped by sm");
    expect(link.querySelector('.sm-mark .sm-cursor[aria-hidden="true"]')).not.toBeNull();
    expect(link.closest("footer")).not.toBeNull();
  });

  it("fetches the room chunk once the browser is idle", async () => {
    render(<Home />);
    await vi.waitFor(() => expect(prefetchRoom).toHaveBeenCalled(), { timeout: 4000 });
  });

  it("fetches the room chunk when someone points at create or focuses the room id", async () => {
    render(<Home />);
    await userEvent.hover(screen.getByRole("button", { name: /create room/ }));
    expect(prefetchRoom).toHaveBeenCalled();
    prefetchRoom.mockClear();
    screen.getByRole("textbox", { name: "room id" }).focus();
    expect(prefetchRoom).toHaveBeenCalled();
  });
});
