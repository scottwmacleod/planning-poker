import { cn } from "cn";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";

import { ToggleGroupContext, useToggleGroupState } from "./toggleGroupContext";
import type { ToggleVariant } from "./toggleVariants";

interface ToggleGroupProps {
  "aria-label": string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  variant?: ToggleVariant;
  className?: string;
  children: ReactNode;
}

export function ToggleGroup({
  "aria-label": label,
  value,
  onValueChange,
  disabled = false,
  variant = "card",
  className,
  children,
}: ToggleGroupProps): ReactElement {
  const state = useToggleGroupState(variant, disabled);
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      data-slot="toggle-group"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (!disabled && next !== "") onValueChange(next);
      }}
      className={cn("flex", className)}
    >
      <ToggleGroupContext value={state}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
  );
}
