import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Field from "./Field";

describe("Field", () => {
  it("labels its input in the lowercase mono voice", () => {
    render(<Field id="room-id" label="room id" placeholder="e.g. abc12345" />);
    const input = screen.getByLabelText("room id");
    expect(input).toHaveAttribute("id", "room-id");
    expect(input).toHaveAttribute("placeholder", "e.g. abc12345");
    expect(screen.getByText("room id")).toHaveClass("font-mono", "text-ink-muted");
  });

  it("is ui-sdk's field, so clicking the label focuses the input", async () => {
    render(<Field id="room-id" label="room id" />);
    const input = screen.getByRole("textbox", { name: "room id" });
    expect(input.closest('[data-slot="field"]')).not.toBeNull();
    await userEvent.click(screen.getByText("room id"));
    expect(input).toHaveFocus();
  });

  it("uses the shared input style", () => {
    render(<Field id="player-name" label="your name" />);
    expect(screen.getByLabelText("your name")).toHaveClass(
      "rounded-1",
      "border-control-line",
      "focus-ring",
    );
  });
});
