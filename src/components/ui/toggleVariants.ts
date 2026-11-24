import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "focus-ring inline-flex items-center justify-center font-mono touch-manipulation aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
  {
    variants: {
      variant: {
        segment:
          "-ml-px border border-border px-4 py-1.5 text-muted-foreground first:ml-0 data-[state=off]:hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground",
        card: "press relative h-18 w-12 select-none rounded-1 border border-input bg-card text-lg font-semibold tabular-nums text-foreground data-[state=off]:not-aria-disabled:hover:border-foreground data-[state=on]:border-2 data-[state=on]:border-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-24 sm:w-16 sm:text-(length:--poker-text-card)",
      },
    },
  },
);

export type ToggleVariant = "segment" | "card";
