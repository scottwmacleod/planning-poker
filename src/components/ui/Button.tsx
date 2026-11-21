import { Button as UiButton } from "@ui-sdk/react/button";
import type { ComponentProps } from "react";

const BASE =
  "focus-ring rounded-1 border font-mono touch-manipulation transition-colors disabled:cursor-not-allowed";

const VARIANTS = {
  signal:
    "press min-h-11 border-signal-ink bg-signal font-semibold text-on-signal enabled:hover:bg-signal-hover disabled:border-control-line disabled:bg-transparent disabled:text-ink-muted",
  outline:
    "border-control-line text-ink enabled:hover:border-ink enabled:hover:bg-surface-hover disabled:text-ink-muted",
};

const SIZES = {
  sm: "px-3 py-1 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-space-4 py-space-4 text-lg",
};

interface ButtonProps extends ComponentProps<typeof UiButton> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export default function Button({
  variant = "outline",
  size = "sm",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <UiButton
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
