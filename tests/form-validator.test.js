import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRegistrationForm,
} from '../js/form-validator.js'

describe('validatePassword - boundary values', () => {
  it('accepts exactly 8 characters with all requirements met', () => {
    const result = validatePassword('Aa1!aaaa')
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('accepts exactly 128 characters with all requirements met', () => {
    // 128 chars: 'A' + 'a' + '1' + '!' + 124 'a's
    const password = 'Aa1!' + 'a'.repeat(124)
    expect(password.length).toBe(128)
    const result = validatePassword(password)
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('rejects 7 characters', () => {
    const result = validatePassword('Aa1!aaa')
    expect(result.valid).toBe(false)
  })

  it('rejects 129 characters', () => {
    const password = 'Aa1!' + 'a'.repeat(125)
    expect(password.length).toBe(129)
    const result = validatePassword(password)
    expect(result.valid).toBe(false)
  })

  it('rejects empty string with required message', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })

  it('rejects whitespace-only with required message', () => {
    const result = validatePassword('   ')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })

  it('rejects password missing uppercase', () => {
    const result = validatePassword('aa1!aaaa')
    expect(result.valid).toBe(false)
  })

  it('rejects password missing lowercase', () => {
    const result = validatePassword('AA1!AAAA')
    expect(result.valid).toBe(false)
  })

  it('rejects password missing digit', () => {
    const result = validatePassword('Aaa!aaaa')
    expect(result.valid).toBe(false)
  })

  it('rejects password missing special character', () => {
    const result = validatePassword('Aa1aaaaa')
    expect(result.valid).toBe(false)
  })
})

describe('validateEmail - edge cases', () => {
  it('rejects email missing @', () => {
    const result = validateEmail('userdomain.com')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Please enter a valid email address')
  })

  it('rejects email missing domain', () => {
    const result = validateEmail('user@')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Please enter a valid email address')
  })

  it('rejects email over 254 characters', () => {
    const longLocal = 'a'.repeat(244)
    const email = `${longLocal}@domain.com` // 244 + 1 + 10 = 255 chars
    expect(email.length).toBeGreaterThan(254)
    const result = validateEmail(email)
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Please enter a valid email address')
  })

  it('accepts valid email', () => {
    const result = validateEmail('user@example.com')
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('rejects empty email with required message', () => {
    const result = validateEmail('')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })
})

describe('validatePasswordMatch', () => {
  it('accepts matching passwords', () => {
    const result = validatePasswordMatch('Aa1!aaaa', 'Aa1!aaaa')
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('rejects non-matching passwords', () => {
    const result = validatePasswordMatch('Aa1!aaaa', 'Bb2@bbbb')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Passwords do not match')
  })

  it('rejects empty confirmPassword with required message', () => {
    const result = validatePasswordMatch('Aa1!aaaa', '')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })
})

describe('validateRegistrationForm', () => {
  it('returns empty Map when all fields are valid', () => {
    const errors = validateRegistrationForm({
      email: 'user@example.com',
      phoneNumber: '+2341234567890',
      password: 'Aa1!aaaa',
      confirmPassword: 'Aa1!aaaa',
    })
    expect(errors.size).toBe(0)
  })

  it('returns Map with 4 entries when all fields are empty', () => {
    const errors = validateRegistrationForm({
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    })
    expect(errors.size).toBe(4)
    expect(errors.has('email')).toBe(true)
    expect(errors.has('phoneNumber')).toBe(true)
    expect(errors.has('password')).toBe(true)
    expect(errors.has('confirmPassword')).toBe(true)
  })

  it('returns errors only for invalid fields when some fields are valid', () => {
    const errors = validateRegistrationForm({
      email: 'user@example.com',
      phoneNumber: '',
      password: 'Aa1!aaaa',
      confirmPassword: 'different',
    })
    expect(errors.size).toBe(2)
    expect(errors.has('email')).toBe(false)
    expect(errors.has('password')).toBe(false)
    expect(errors.has('phoneNumber')).toBe(true)
    expect(errors.get('phoneNumber')).toBe('This field is required')
    expect(errors.has('confirmPassword')).toBe(true)
    expect(errors.get('confirmPassword')).toBe('Passwords do not match')
  })
})
