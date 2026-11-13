import type { InputHTMLAttributes, Ref } from 'react'

const BASE =
  'focus-ring rounded-1 border border-control-line bg-surface text-ink placeholder:text-ink-muted'

const SIZES = {
  sm: 'px-2 py-1 text-sm',
  md: 'w-full px-space-4 py-space-3 text-base',
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: keyof typeof SIZES
  ref?: Ref<HTMLInputElement>
}

export default function Input({ size = 'md', type = 'text', className = '', ...props }: InputProps) {
  return <input type={type} className={`${BASE} ${SIZES[size]} ${className}`} {...props} />
}
