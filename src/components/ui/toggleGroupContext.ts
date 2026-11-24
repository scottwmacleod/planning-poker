import { createContext, useContext, useMemo } from "react";

import type { ToggleVariant } from "./toggleVariants";

interface ToggleGroupState {
  variant: ToggleVariant;
  disabled: boolean;
}

export const ToggleGroupContext = createContext<ToggleGroupState>({
  variant: "card",
  disabled: false,
});

export function useToggleGroup(): ToggleGroupState {
  return useContext(ToggleGroupContext);
}

export function useToggleGroupState(variant: ToggleVariant, disabled: boolean): ToggleGroupState {
  return useMemo(() => ({ variant, disabled }), [variant, disabled]);
}
