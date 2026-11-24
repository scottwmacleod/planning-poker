import { cn } from "cn";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ComponentProps, ReactElement } from "react";

import { useToggleGroup } from "./toggleGroupContext";
import { toggleVariants } from "./toggleVariants";

export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>): ReactElement {
  const { variant, disabled } = useToggleGroup();
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      aria-disabled={disabled || undefined}
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    />
  );
}
