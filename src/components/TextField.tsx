import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
}

export function TextField({ label, error, className = '', ...inputProps }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-surface-alt border rounded-lg px-4 py-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent ${
          error ? 'border-red' : 'border-border'
        } ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} role="alert" className="text-red text-[11px] mt-1 flex items-start gap-1">
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
