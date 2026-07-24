import { describe, expect, it } from 'vitest'
import {
  sanitizeFullNameInput,
  normalizeFullName,
  validateFullName,
  sanitizeEmailInput,
  validateEmail,
  sanitizePasswordInput,
  validatePassword,
  getPasswordRequirements,
  getPasswordStrength,
  validateConfirmPassword,
} from './validation'

describe('sanitizeFullNameInput', () => {
  it('strips digits and symbols while typing', () => {
    expect(sanitizeFullNameInput('Juan123 P3rez!')).toBe('Juan Prez')
  })

  it('collapses consecutive spaces', () => {
    expect(sanitizeFullNameInput('Juan    Perez')).toBe('Juan Perez')
  })

  it('keeps accented letters and ñ', () => {
    expect(sanitizeFullNameInput('José Muñoz')).toBe('José Muñoz')
  })
})

describe('normalizeFullName', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeFullName('  Juan Perez  ')).toBe('Juan Perez')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeFullName('Juan   Perez')).toBe('Juan Perez')
  })
})

describe('validateFullName', () => {
  it.each([
    ['José Muñoz'],
    ['Ana María López'],
    ['Li'.padEnd(3, 'a')],
  ])('accepts valid name: %s', (name) => {
    expect(validateFullName(name).valid).toBe(true)
  })

  it('rejects empty name', () => {
    expect(validateFullName('   ').valid).toBe(false)
  })

  it('rejects names with numbers', () => {
    expect(validateFullName('Juan123').valid).toBe(false)
  })

  it('rejects names shorter than the minimum', () => {
    expect(validateFullName('Al').valid).toBe(false)
  })

  it('rejects names longer than the maximum', () => {
    expect(validateFullName('a'.repeat(61)).valid).toBe(false)
  })

  it('rejects names with symbols', () => {
    expect(validateFullName('Juan@Perez').valid).toBe(false)
  })
})

describe('sanitizeEmailInput', () => {
  it('removes whitespace and lowercases', () => {
    expect(sanitizeEmailInput('  Test@Example.COM ')).toBe('test@example.com')
  })
})

describe('validateEmail', () => {
  it.each([
    ['test@example.com'],
    ['user.name+tag@sub.domain.co'],
  ])('accepts valid email: %s', (email) => {
    expect(validateEmail(email).valid).toBe(true)
  })

  it.each([
    ['plainaddress'],
    ['missing@domain'],
    ['@nodomain.com'],
    ['spaced @example.com'],
    [''],
  ])('rejects invalid email: %s', (email) => {
    expect(validateEmail(email).valid).toBe(false)
  })
})

describe('sanitizePasswordInput', () => {
  it('strips all whitespace', () => {
    expect(sanitizePasswordInput('Abc 123!')).toBe('Abc123!')
  })
})

describe('validatePassword', () => {
  it('accepts a password meeting every requirement', () => {
    expect(validatePassword('Secure1!').valid).toBe(true)
  })

  it('rejects passwords shorter than the minimum', () => {
    expect(validatePassword('Ab1!').valid).toBe(false)
  })

  it('rejects passwords without an uppercase letter', () => {
    expect(validatePassword('secure1!').valid).toBe(false)
  })

  it('rejects passwords without a lowercase letter', () => {
    expect(validatePassword('SECURE1!').valid).toBe(false)
  })

  it('rejects passwords without a number', () => {
    expect(validatePassword('Secureaa!').valid).toBe(false)
  })

  it('rejects passwords without a special character', () => {
    expect(validatePassword('Secure123').valid).toBe(false)
  })

  it('rejects passwords with spaces', () => {
    expect(validatePassword('Secure 1!').valid).toBe(false)
  })

  it('rejects empty passwords', () => {
    expect(validatePassword('').valid).toBe(false)
  })
})

describe('getPasswordRequirements', () => {
  it('reports each requirement individually', () => {
    const reqs = getPasswordRequirements('Secure1!')
    const met = Object.fromEntries(reqs.map((r) => [r.key, r.met]))
    expect(met).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      noSpaces: true,
    })
  })
})

describe('getPasswordStrength', () => {
  it('scores an empty password as 0', () => {
    expect(getPasswordStrength('').score).toBe(0)
  })

  it('scores a weak password low', () => {
    expect(getPasswordStrength('abc').score).toBeLessThanOrEqual(1)
  })

  it('scores a password meeting all core requirements as strong', () => {
    expect(getPasswordStrength('Secure1!').score).toBeGreaterThanOrEqual(3)
  })

  it('scores a long password meeting all requirements as the strongest', () => {
    expect(getPasswordStrength('VeryLongSecure123!').score).toBe(4)
  })
})

describe('validateConfirmPassword', () => {
  it('accepts matching passwords', () => {
    expect(validateConfirmPassword('Secure1!', 'Secure1!').valid).toBe(true)
  })

  it('rejects non-matching passwords', () => {
    expect(validateConfirmPassword('Secure1!', 'Secure2!').valid).toBe(false)
  })

  it('rejects an empty confirmation', () => {
    expect(validateConfirmPassword('Secure1!', '').valid).toBe(false)
  })
})
