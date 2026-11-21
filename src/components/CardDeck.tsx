import { DECKS, type Deck } from "../../lib/types";
import { Toggle, ToggleGroup } from "./ui";

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
        aria-label="Card deck"
        value={[deck]}
        onValueChange={([d]) => d && onChangeDeck(d)}
        deselectable={false}
        className="flex font-mono text-sm"
      >
        {DECK_BUTTONS.map(({ deck: d, label }, i) => (
          <Toggle
            key={d}
            value={d}
            className={`focus-ring px-4 py-1.5 border border-line touch-manipulation ${i > 0 ? "-ml-px" : ""} ${
              deck === d ? "bg-surface text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </Toggle>
        ))}
      </ToggleGroup>

      <ToggleGroup
        aria-label="Cards"
        value={selectedCard === null ? [] : [selectedCard]}
        onValueChange={([val]) => val && onVote(val)}
        deselectable={false}
        disabled={disabled}
        className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2"
      >
        {cards.map((card) => {
          const val = String(card);
          const isSelected = selectedCard === val;
          return (
            <Toggle
              key={val}
              value={val}
              className={`focus-ring press relative w-12 h-18 sm:w-16 sm:h-24 rounded-1 font-mono font-semibold tabular-nums text-lg sm:text-[22px] select-none touch-manipulation data-disabled:opacity-40 data-disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-signal-tint border-2 border-signal-ink text-signal-ink"
                  : "bg-surface border border-control-line text-ink hover:border-ink"
              }`}
            >
              {isSelected && (
                <span aria-hidden="true" className="absolute top-1 left-1.5 text-xs leading-none">
                  +
                </span>
              )}
              {val}
            </Toggle>
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
