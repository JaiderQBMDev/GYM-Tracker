import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { getPasswordRequirements, getPasswordStrength } from '../lib/validation'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'value'> {
  label: string
  error?: string
  value: string
  showRequirements?: boolean
  showStrength?: boolean
}

const STRENGTH_BAR_COLOR = ['bg-red', 'bg-orange', 'bg-orange', 'bg-green', 'bg-green']

export function PasswordField({
  label,
  error,
  value,
  showRequirements = false,
  showStrength = false,
  className = '',
  ...inputProps
}: PasswordFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const reqsId = `${id}-requirements`
  const [visible, setVisible] = useState(false)

  const requirements = showRequirements ? getPasswordRequirements(value) : []
  const strength = showStrength ? getPasswordStrength(value) : null

  const describedBy = [error ? errorId : null, showRequirements ? reqsId : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full bg-surface-alt border rounded-lg px-4 py-3 pr-11 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent ${
            error ? 'border-red' : 'border-border'
          } ${className}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-red text-[11px] mt-1 flex items-start gap-1">
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </p>
      )}

      {showStrength && strength && value.length > 0 && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1 h-1" role="img" aria-label={`Seguridad de la contraseña: ${strength.label}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-full ${i <= strength.score ? STRENGTH_BAR_COLOR[strength.score] : 'bg-border'}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Seguridad: {strength.label}</p>
        </div>
      )}

      {showRequirements && (
        <ul id={reqsId} className="mt-2 flex flex-col gap-0.5">
          {requirements.map((r) => (
            <li
              key={r.key}
              className={`text-[11px] flex items-center gap-1.5 ${r.met ? 'text-green' : 'text-text-secondary'}`}
            >
              {r.met ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
              <span>{r.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
