import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DECKS } from "../../lib/types";
import CardDeck from "./CardDeck";

const defaultProps = {
  deck: "fibonacci" as const,
  selectedCard: null,
  onVote: vi.fn(),
  onChangeDeck: vi.fn(),
  disabled: false,
};

describe("CardDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("press feedback", () => {
    it("gives every card the shared press class", () => {
      render(<CardDeck {...defaultProps} />);
      DECKS.fibonacci.forEach((card) => {
        expect(screen.getByRole("radio", { name: String(card) })).toHaveClass("press");
      });
    });
  });

  describe("card rendering", () => {
    it("renders all fibonacci cards", () => {
      render(<CardDeck {...defaultProps} />);
      DECKS.fibonacci.forEach((card) => {
        expect(screen.getByRole("radio", { name: String(card) })).toBeInTheDocument();
      });
    });

    it("renders all tshirt cards", () => {
      render(<CardDeck {...defaultProps} deck="tshirt" />);
      DECKS.tshirt.forEach((card) => {
        expect(screen.getByRole("radio", { name: String(card) })).toBeInTheDocument();
      });
    });

    it("does not render tshirt cards when deck is fibonacci", () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />);
      expect(screen.queryByRole("radio", { name: "XS" })).not.toBeInTheDocument();
    });
  });

  describe("voting", () => {
    it("calls onVote with card value when clicked", async () => {
      render(<CardDeck {...defaultProps} />);
      await userEvent.click(screen.getByRole("radio", { name: "5" }));
      expect(defaultProps.onVote).toHaveBeenCalledWith("5");
    });

    it("does not call onVote when disabled", async () => {
      render(<CardDeck {...defaultProps} disabled />);
      await userEvent.click(screen.getByRole("radio", { name: "5" }));
      expect(defaultProps.onVote).not.toHaveBeenCalled();
    });

    it("keeps disabled cards reachable, says they are unavailable and fades them", async () => {
      render(<CardDeck {...defaultProps} disabled />);
      const five = screen.getByRole("radio", { name: "5" });
      expect(five).toHaveAttribute("aria-disabled", "true");
      expect(five).toHaveClass("aria-disabled:opacity-40");
      five.focus();
      await userEvent.keyboard("{Enter}");
      expect(defaultProps.onVote).not.toHaveBeenCalled();
    });

    it("does not unvote when the selected card is pressed again", async () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />);
      await userEvent.click(screen.getByRole("radio", { name: "5" }));
      expect(screen.getByRole("radio", { name: "5" })).toHaveAttribute("aria-checked", "true");
      expect(defaultProps.onVote).not.toHaveBeenCalledWith("");
    });

    it("selected card uses the accent tint and an accent-ink border", () => {
      expect.hasAssertions();
      render(<CardDeck {...defaultProps} selectedCard="5" />);
      const card = screen.getByRole("radio", { name: "5" });
      expect(card).toHaveAttribute("aria-checked", "true");
      expect(card).toHaveAttribute("data-state", "on");
      expect(card).toHaveClass(
        "data-[state=on]:bg-accent",
        "data-[state=on]:border-accent-foreground",
      );
    });

    it("unselected cards use the card fill and input border", () => {
      expect.hasAssertions();
      render(<CardDeck {...defaultProps} selectedCard="5" />);
      const card = screen.getByRole("radio", { name: "3" });
      expect(card).toHaveAttribute("aria-checked", "false");
      expect(card).toHaveAttribute("data-state", "off");
      expect(card).toHaveClass("bg-card", "border-input");
    });

    it("no card selected when selectedCard is null", () => {
      render(<CardDeck {...defaultProps} selectedCard={null} />);
      DECKS.fibonacci.forEach((card) => {
        expect(screen.getByRole("radio", { name: String(card) })).toHaveAttribute(
          "aria-checked",
          "false",
        );
      });
      expect(screen.queryByText(/you voted/)).not.toBeInTheDocument();
    });

    it("marks the selected card with a + sign that is hidden from screen readers", () => {
      render(<CardDeck {...defaultProps} selectedCard="5" />);
      const sign = screen.getByRole("radio", { name: "5" }).querySelector('[aria-hidden="true"]');
      expect(sign).toHaveTextContent("+");
    });

    it("says which card you voted for below the deck", () => {
      render(<CardDeck {...defaultProps} selectedCard="8" />);
      expect(screen.getByText(/you voted 8/)).toHaveTextContent("+ you voted 8");
    });
  });

  describe("keyboard navigation", () => {
    const card = (name: string) => screen.getByRole("radio", { name });

    it("puts the cards in one named radio group", () => {
      render(<CardDeck {...defaultProps} />);
      const group = screen.getByRole("radiogroup", { name: "Cards" });
      expect(group).toHaveAttribute("data-slot", "toggle-group");
      expect(group).toContainElement(card("5"));
    });

    it("makes the cards one tab stop, starting at the first card", async () => {
      expect.hasAssertions();
      render(<CardDeck {...defaultProps} />);
      await userEvent.tab();
      await userEvent.tab();
      expect(card("1")).toHaveFocus();
      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });

    it("tabs to the selected card", async () => {
      expect.hasAssertions();
      render(<CardDeck {...defaultProps} selectedCard="8" />);
      await userEvent.tab();
      await userEvent.tab();
      expect(card("8")).toHaveFocus();
    });

    it("moves focus to the next card with the right arrow", async () => {
      render(<CardDeck {...defaultProps} />);
      card("1").focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(card("3")).toHaveFocus();
    });

    it("moves focus to the previous card with the left arrow", async () => {
      render(<CardDeck {...defaultProps} />);
      card("5").focus();
      await userEvent.keyboard("{ArrowLeft}");
      expect(card("3")).toHaveFocus();
    });

    it("wraps from the last card to the first and back", async () => {
      render(<CardDeck {...defaultProps} />);
      card("?").focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(card("1")).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      expect(card("?")).toHaveFocus();
    });

    it("jumps to the first and last cards with Home and End", async () => {
      render(<CardDeck {...defaultProps} />);
      card("5").focus();
      await userEvent.keyboard("{End}");
      expect(card("?")).toHaveFocus();
      await userEvent.keyboard("{Home}");
      expect(card("1")).toHaveFocus();
    });

    it("does not vote when moving focus", async () => {
      render(<CardDeck {...defaultProps} />);
      card("1").focus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      expect(defaultProps.onVote).not.toHaveBeenCalled();
    });

    it("votes for the focused card with Enter and Space", async () => {
      render(<CardDeck {...defaultProps} />);
      card("1").focus();
      await userEvent.keyboard("{ArrowRight}{Enter}");
      expect(defaultProps.onVote).toHaveBeenLastCalledWith("3");
      await userEvent.keyboard("{ArrowRight} ");
      expect(defaultProps.onVote).toHaveBeenLastCalledWith("5");
    });
  });

  describe("deck switching", () => {
    it("calls onChangeDeck when fibonacci button clicked", async () => {
      render(<CardDeck {...defaultProps} deck="tshirt" />);
      await userEvent.click(screen.getByRole("radio", { name: "fibonacci" }));
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith("fibonacci");
    });

    it("calls onChangeDeck when t-shirt button clicked", async () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />);
      await userEvent.click(screen.getByRole("radio", { name: "t-shirt" }));
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith("tshirt");
    });

    it("is one tab stop: arrows move between decks and Enter switches", async () => {
      render(<CardDeck {...defaultProps} deck="fibonacci" />);
      const group = screen.getByRole("radiogroup", { name: "Card deck" });
      expect(group).toHaveAttribute("data-slot", "toggle-group");
      await userEvent.tab();
      expect(screen.getByRole("radio", { name: "fibonacci" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "t-shirt" })).toHaveFocus();
      expect(defaultProps.onChangeDeck).not.toHaveBeenCalled();
      await userEvent.keyboard("{Enter}");
      expect(defaultProps.onChangeDeck).toHaveBeenCalledWith("tshirt");
      await userEvent.tab();
      expect(screen.getByRole("radio", { name: "fibonacci" })).not.toHaveFocus();
      expect(screen.getByRole("radio", { name: "t-shirt" })).not.toHaveFocus();
    });

    it("active deck button has active styles", () => {
      expect.hasAssertions();
      render(<CardDeck {...defaultProps} deck="fibonacci" />);
      const fibonacci = screen.getByRole("radio", { name: "fibonacci" });
      expect(fibonacci).toHaveAttribute("data-state", "on");
      expect(fibonacci).toHaveClass("data-[state=on]:bg-card", "data-[state=on]:text-foreground");
      expect(screen.getByRole("radio", { name: "t-shirt" })).toHaveAttribute("data-state", "off");
    });
  });
});
