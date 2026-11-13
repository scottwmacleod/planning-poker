import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

// A native checkbox drawn to match a selected vote card: square, control-line
// outline, then signal-tint fill with a signal-ink border and tick when checked.
// Keeping the native input keeps keyboard, form and screen reader behaviour.
export default function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-space-3 ${className}`}>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="focus-ring peer size-5 cursor-pointer appearance-none rounded-1 border border-control-line bg-surface checked:border-2 checked:border-signal-ink checked:bg-signal-tint"
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute inset-0 hidden size-5 text-signal-ink peer-checked:block"
        >
          <path d="M5 10.5l3.5 3.5L15 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </span>
      <span className="font-mono text-sm text-ink-body">{label}</span>
    </label>
  )
}
