import { DECKS, type Deck } from "../../lib/types";
import { ToggleGroup } from "./ui/ToggleGroup";
import { ToggleGroupItem } from "./ui/ToggleGroupItem";

interface CardDeckProps {
  deck: Deck;
  selectedCard: string | null;
  onVote: (value: string) => void;
  onChangeDeck: (deck: Deck) => void;
  disabled: boolean;
}

const DECK_BUTTONS: { deck: Deck; label: string }[] = [
  { deck: "fibonacci", label: "fibonacci" },
  { deck: "tshirt", label: "t-shirt" },
];

export default function CardDeck({
  deck,
  selectedCard,
  onVote,
  onChangeDeck,
  disabled,
}: CardDeckProps) {
  const cards = DECKS[deck];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      <ToggleGroup
        variant="segment"
        aria-label="Card deck"
        value={deck}
        onValueChange={(value) => {
          const picked = DECK_BUTTONS.find((b) => b.deck === value);
          if (picked) onChangeDeck(picked.deck);
        }}
        className="text-sm"
      >
        {DECK_BUTTONS.map(({ deck: d, label }) => (
          <ToggleGroupItem key={d} value={d}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ToggleGroup
        aria-label="Cards"
        value={selectedCard ?? ""}
        onValueChange={onVote}
        disabled={disabled}
        className="flex-wrap justify-center gap-2 sm:gap-3 px-2"
      >
        {cards.map((card) => {
          const val = String(card);
          return (
            <ToggleGroupItem key={val} value={val}>
              {selectedCard === val && (
                <span aria-hidden="true" className="absolute top-1 left-1.5 text-xs leading-none">
                  +
                </span>
              )}
              {val}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {selectedCard !== null && (
        <p className="font-mono text-sm text-ink-muted">
          <span aria-hidden="true" className="text-signal-ink">
            +{" "}
          </span>
          you voted {selectedCard}
        </p>
      )}
    </div>
  );
}
