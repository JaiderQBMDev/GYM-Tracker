import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Dumbbell, Mail } from 'lucide-react'
import { useAuthStore, SignUpNeedsConfirmation } from '../stores/auth'
import { TextField } from '../components/TextField'
import { PasswordField } from '../components/PasswordField'
import {
  sanitizeFullNameInput,
  normalizeFullName,
  validateFullName,
  sanitizeEmailInput,
  validateEmail,
  sanitizePasswordInput,
  validatePassword,
  validateConfirmPassword,
} from '../lib/validation'

type Mode = 'login' | 'register'
type FieldName = 'fullName' | 'email' | 'password' | 'confirmPassword'

export function LoginPage() {
  const { session, signIn, signUp } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const errors = useMemo(() => {
    const e: Partial<Record<FieldName, string>> = {}

    if (mode === 'register') {
      const nameResult = validateFullName(fullName)
      if (!nameResult.valid) e.fullName = nameResult.error
    }

    const emailResult = validateEmail(email)
    if (!emailResult.valid) e.email = emailResult.error

    if (mode === 'register') {
      const passwordResult = validatePassword(password)
      if (!passwordResult.valid) e.password = passwordResult.error

      const confirmResult = validateConfirmPassword(password, confirmPassword)
      if (!confirmResult.valid) e.confirmPassword = confirmResult.error
    } else if (password.length === 0) {
      e.password = 'La contraseña es obligatoria'
    }

    return e
  }, [mode, fullName, email, password, confirmPassword])

  const shownError = (field: FieldName): string | undefined =>
    (touched[field] || submitted) ? errors[field] : undefined

  const markTouched = (field: FieldName) => setTouched((t) => ({ ...t, [field]: true }))

  const hasErrors = Object.keys(errors).length > 0

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitted(true)

    if (hasErrors) return

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, normalizeFullName(fullName))
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      if (err instanceof SignUpNeedsConfirmation) {
        setConfirmationSent(true)
      } else {
        setError(translateAuthError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setTouched({})
    setSubmitted(false)
  }

  if (confirmationSent) {
    return (
      <div className="flex-1 flex flex-col bg-bg relative overflow-hidden">
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_65%)] pointer-events-none" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="w-16 h-16 bg-surface rounded-[20px] border border-accent-border flex items-center justify-center mb-6">
            <Mail size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Revisa tu correo</h1>
          <p className="text-text-secondary text-sm max-w-[280px] mb-2">
            Enviamos un enlace de confirmación a
          </p>
          <p className="text-accent font-semibold text-sm mb-6">{email}</p>
          <p className="text-text-secondary text-xs max-w-[280px] mb-8">
            Haz clic en el enlace del correo para activar tu cuenta. Luego vuelve aquí para iniciar sesión.
          </p>
          <button
            onClick={() => { setConfirmationSent(false); switchMode('login') }}
            className="bg-accent text-bg font-bold py-3 px-8 rounded-lg text-sm"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-bg relative overflow-hidden">
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_65%)] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-16 h-16 bg-surface rounded-[20px] border border-accent-border flex items-center justify-center mb-6">
          <Dumbbell size={28} className="text-accent" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Gym Tracker</h1>
        <p className="text-text-secondary text-sm mb-8">
          Lleva tu rendimiento al siguiente nivel
        </p>

        {/* Toggle */}
        <div className="flex bg-surface-alt rounded-lg border border-border p-[3px] mb-6 w-full max-w-xs">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 text-center py-2 text-sm font-bold rounded-md transition-colors ${
              mode === 'login' ? 'bg-accent text-bg' : 'text-text-secondary'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 text-center py-2 text-sm font-bold rounded-md transition-colors ${
              mode === 'register' ? 'bg-accent text-bg' : 'text-text-secondary'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="w-full max-w-xs flex flex-col gap-3">
          {mode === 'register' && (
            <TextField
              label="Nombre completo"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(sanitizeFullNameInput(e.target.value))}
              onBlur={() => { setFullName((v) => normalizeFullName(v)); markTouched('fullName') }}
              error={shownError('fullName')}
              required
            />
          )}

          <TextField
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete={mode === 'register' ? 'email' : 'username'}
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
            onBeforeInput={(e) => {
              if ((e.nativeEvent as InputEvent).data === ' ') e.preventDefault()
            }}
            onBlur={() => { setEmail((v) => v.trim()); markTouched('email') }}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            error={shownError('email')}
            required
          />

          <PasswordField
            label="Contraseña"
            name="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(sanitizePasswordInput(e.target.value))}
            onBlur={() => markTouched('password')}
            error={shownError('password')}
            showRequirements={mode === 'register'}
            showStrength={mode === 'register'}
            required
          />

          {mode === 'register' && (
            <PasswordField
              label="Confirmar contraseña"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(sanitizePasswordInput(e.target.value))}
              onBlur={() => markTouched('confirmPassword')}
              error={shownError('confirmPassword')}
              required
            />
          )}

          {error && (
            <p className="text-red text-xs text-center" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || hasErrors}
            aria-busy={loading}
            className="w-full bg-accent text-bg font-bold py-3 rounded-lg text-sm transition-opacity disabled:opacity-50 mt-2"
          >
            {loading
              ? 'Cargando...'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'Debes confirmar tu correo electrónico antes de iniciar sesión',
  'User already registered': 'Ya existe una cuenta con este correo',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'El formato del correo no es válido',
  'Signup requires a valid password': 'La contraseña no es válida',
}

function translateAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Error desconocido'
  return AUTH_ERRORS[err.message] ?? err.message
}
