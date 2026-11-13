import type { ComponentProps } from 'react'
import Input from './Input'

interface FieldProps extends ComponentProps<typeof Input> {
  id: string
  label: string
}

// A visible label above an input, in the lowercase mono voice.
export default function Field({ id, label, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-space-2">
      <label htmlFor={id} className="font-mono text-sm text-ink-muted">
        {label}
      </label>
      <Input id={id} {...props} />
    </div>
  )
}
