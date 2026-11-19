import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("is a plain button by default, so it never submits a form by accident", () => {
    render(<Button>copy link</Button>);
    expect(screen.getByRole("button", { name: "copy link" })).toHaveAttribute("type", "button");
  });

  it("can submit a form when asked", () => {
    render(<Button type="submit">enter room</Button>);
    expect(screen.getByRole("button", { name: "enter room" })).toHaveAttribute("type", "submit");
  });

  it("has the brand corners, focus ring and mono type in every variant", () => {
    render(
      <>
        <Button variant="signal">a</Button>
        <Button variant="outline">b</Button>
      </>,
    );
    for (const name of ["a", "b"]) {
      expect(screen.getByRole("button", { name })).toHaveClass(
        "rounded-1",
        "focus-ring",
        "font-mono",
      );
    }
  });

  it("signal buttons are lime, darken to signal-hover, press down and are never lime when disabled", () => {
    render(
      <Button variant="signal" disabled>
        join room
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "join room" });
    expect(btn).toHaveClass(
      "bg-signal",
      "text-on-signal",
      "press",
      "enabled:hover:bg-signal-hover",
    );
    expect(btn.className).not.toMatch(/hover:bg-signal-ink|hover:text-ground/);
    expect(btn).toHaveClass(
      "disabled:border-control-line",
      "disabled:bg-transparent",
      "disabled:text-ink-muted",
      "disabled:cursor-not-allowed",
    );
    expect(btn).toBeDisabled();
  });

  it("signal buttons are at least 44px tall", () => {
    render(<Button variant="signal">create room</Button>);
    expect(screen.getByRole("button", { name: "create room" })).toHaveClass("min-h-11");
  });

  it("outline buttons use the control outline and fill with surface-hover on hover", () => {
    render(<Button>copy link</Button>);
    expect(screen.getByRole("button", { name: "copy link" })).toHaveClass(
      "border-control-line",
      "text-ink",
      "enabled:hover:border-ink",
      "enabled:hover:bg-surface-hover",
      "disabled:text-ink-muted",
    );
  });

  it("adds layout classes from the caller and passes other props through", async () => {
    const onClick = vi.fn();
    render(
      <Button className="w-full" aria-pressed={true} onClick={onClick}>
        observing
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "observing" });
    expect(btn).toHaveClass("w-full");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
