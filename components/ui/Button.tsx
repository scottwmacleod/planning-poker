import type { ButtonHTMLAttributes } from 'react'

// Shared button in the scottmacleod.co style: 2px corners, mono type, lime
// `signal` for the main action on a screen and `outline` for everything else.
// Variants are a plain class map; callers add layout classes only (width, margin).

const BASE =
  'focus-ring rounded-1 border font-mono touch-manipulation transition-colors disabled:cursor-not-allowed'

const VARIANTS = {
  signal:
    'press border-signal-ink bg-signal font-semibold text-on-signal enabled:hover:bg-signal-ink enabled:hover:text-ground disabled:border-control-line disabled:bg-transparent disabled:text-ink-muted',
  outline: 'border-control-line text-ink hover:border-ink',
}

const SIZES = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-space-4 py-space-4 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

export default function Button({
  variant = 'outline',
  size = 'sm',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
