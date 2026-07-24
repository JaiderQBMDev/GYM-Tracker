export const FULL_NAME_MIN = 3
export const FULL_NAME_MAX = 60
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64

const NAME_CHARS_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ ]*$/
const NAME_ALLOWED_INPUT_REGEX = /[^A-Za-zÀ-ÖØ-öø-ÿÑñ ]/g
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SPECIAL_CHAR_REGEX = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

export interface FieldValidationResult {
  valid: boolean
  error?: string
}

/** Strips digits/symbols and collapses repeated spaces while the user types. */
export function sanitizeFullNameInput(value: string): string {
  return value.replace(NAME_ALLOWED_INPUT_REGEX, '').replace(/ {2,}/g, ' ')
}

/** Trims and collapses internal whitespace; used before validation/submit. */
export function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateFullName(rawValue: string): FieldValidationResult {
  const value = normalizeFullName(rawValue)
  if (value.length === 0) return { valid: false, error: 'El nombre es obligatorio' }
  if (!NAME_CHARS_REGEX.test(value)) {
    return { valid: false, error: 'El nombre solo puede contener letras y espacios' }
  }
  if (value.length < FULL_NAME_MIN) {
    return { valid: false, error: `El nombre debe tener al menos ${FULL_NAME_MIN} caracteres` }
  }
  if (value.length > FULL_NAME_MAX) {
    return { valid: false, error: `El nombre no puede superar ${FULL_NAME_MAX} caracteres` }
  }
  return { valid: true }
}

/** Strips whitespace and lowercases while the user types. */
export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

export function validateEmail(rawValue: string): FieldValidationResult {
  const value = rawValue.trim()
  if (value.length === 0) return { valid: false, error: 'El correo es obligatorio' }
  if (!EMAIL_REGEX.test(value)) {
    return { valid: false, error: 'Ingresa un correo electrónico válido (ejemplo: nombre@dominio.com)' }
  }
  return { valid: true }
}

/** Strips spaces as the user types since passwords may never contain them. */
export function sanitizePasswordInput(value: string): string {
  return value.replace(/\s/g, '')
}

export interface PasswordRequirement {
  key: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special' | 'noSpaces'
  label: string
  met: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      key: 'length',
      label: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`,
      met: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    },
    { key: 'uppercase', label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'Una letra minúscula', met: /[a-z]/.test(password) },
    { key: 'number', label: 'Un número', met: /[0-9]/.test(password) },
    { key: 'special', label: 'Un carácter especial (!@#$...)', met: SPECIAL_CHAR_REGEX.test(password) },
    { key: 'noSpaces', label: 'Sin espacios', met: password.length > 0 && !/\s/.test(password) },
  ]
}

export function validatePassword(password: string): FieldValidationResult {
  if (password.length === 0) return { valid: false, error: 'La contraseña es obligatoria' }
  if (/\s/.test(password)) return { valid: false, error: 'La contraseña no puede contener espacios' }
  const failed = getPasswordRequirements(password).find((r) => !r.met)
  if (failed) return { valid: false, error: `Falta: ${failed.label.toLowerCase()}` }
  return { valid: true }
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte']

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: 'Sin contraseña' }

  const coreRequirements = getPasswordRequirements(password).filter((r) => r.key !== 'noSpaces')
  const metCount = coreRequirements.filter((r) => r.met).length
  const allCoreMet = metCount === coreRequirements.length
  const lengthBonus = allCoreMet && password.length >= 12 ? 1 : 0

  const score = Math.max(0, Math.min(4, metCount - 1 + lengthBonus)) as PasswordStrength['score']
  return { score, label: STRENGTH_LABELS[score] }
}

export function validateConfirmPassword(password: string, confirmPassword: string): FieldValidationResult {
  if (confirmPassword.length === 0) return { valid: false, error: 'Confirma tu contraseña' }
  if (password !== confirmPassword) return { valid: false, error: 'Las contraseñas no coinciden' }
  return { valid: true }
}
