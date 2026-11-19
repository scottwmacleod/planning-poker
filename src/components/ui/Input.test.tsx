import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import Input from "./Input";

describe("Input", () => {
  it("is a text input with the brand corners, outline and focus ring", () => {
    render(<Input aria-label="name" />);
    const input = screen.getByRole("textbox", { name: "name" });
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("rounded-1", "border-control-line", "bg-surface", "focus-ring");
  });

  it("has a compact size for inline editing, still 16px on phones so iOS doesn't zoom", () => {
    render(<Input aria-label="name" size="sm" className="w-28" />);
    expect(screen.getByRole("textbox", { name: "name" })).toHaveClass(
      "text-base",
      "sm:text-sm",
      "w-28",
    );
  });

  it("uses 16px text at the default size", () => {
    render(<Input aria-label="name" />);
    expect(screen.getByRole("textbox", { name: "name" })).toHaveClass("text-base");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="name" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "name" }));
  });
});
