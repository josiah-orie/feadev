import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validatePassword } from '../js/form-validator.js'

// Feature: registration-forms, Property 3: Password rule enforcement
// **Validates: Requirements 4.3**
describe('Property 3: Password rule enforcement', () => {
  // Character category arbitraries
  const upperCharArb = fc.integer({ min: 65, max: 90 }).map((c) => String.fromCharCode(c))
  const lowerCharArb = fc.integer({ min: 97, max: 122 }).map((c) => String.fromCharCode(c))
  const digitCharArb = fc.integer({ min: 48, max: 57 }).map((c) => String.fromCharCode(c))
  const specialCharArb = fc.oneof(
    fc.integer({ min: 33, max: 47 }).map((c) => String.fromCharCode(c)),
    fc.integer({ min: 58, max: 64 }).map((c) => String.fromCharCode(c)),
    fc.integer({ min: 91, max: 96 }).map((c) => String.fromCharCode(c)),
    fc.integer({ min: 123, max: 126 }).map((c) => String.fromCharCode(c))
  )
  const printableCharArb = fc.integer({ min: 33, max: 126 }).map((c) => String.fromCharCode(c))

  // Valid password generator: 8–128 chars with at least one uppercase, lowercase, digit, special
  const validPasswordArb = fc
    .tuple(
      fc.integer({ min: 8, max: 128 }),
      upperCharArb,
      lowerCharArb,
      digitCharArb,
      specialCharArb
    )
    .chain(([len, upper, lower, digit, special]) => {
      const mandatory = [upper, lower, digit, special]
      const remaining = Math.max(0, len - mandatory.length)
      return fc
        .array(printableCharArb, { minLength: remaining, maxLength: remaining })
        .map((filler) => {
          const allChars = [...mandatory, ...filler]
          // Shuffle to avoid mandatory chars always being at the start
          for (let i = allChars.length - 1; i > 0; i--) {
            const j = i % (i + 1) === 0 ? 0 : i % allChars.length
            ;[allChars[i], allChars[j]] = [allChars[j], allChars[i]]
          }
          return allChars.join('')
        })
    })
    .filter(
      (pw) =>
        pw.length >= 8 &&
        pw.length <= 128 &&
        /[A-Z]/.test(pw) &&
        /[a-z]/.test(pw) &&
        /[0-9]/.test(pw) &&
        /[^A-Za-z0-9]/.test(pw)
    )

  it('should return { valid: true } for any string satisfying all Password_Rules', () => {
    fc.assert(
      fc.property(validPasswordArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  // Too short: 1–7 characters (non-whitespace-only so it isn't caught by required check)
  const tooShortArb = fc
    .integer({ min: 1, max: 7 })
    .chain((len) => fc.array(printableCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))
    .filter((pw) => pw.trim().length > 0)

  it('should return { valid: false } for passwords that are too short (< 8 chars)', () => {
    fc.assert(
      fc.property(tooShortArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Too long: 129–200 characters
  const tooLongArb = fc
    .integer({ min: 129, max: 200 })
    .chain((len) => fc.array(printableCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))

  it('should return { valid: false } for passwords that are too long (> 128 chars)', () => {
    fc.assert(
      fc.property(tooLongArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Missing uppercase: has lowercase, digit, special but NO uppercase
  const noUpperCharArb = fc.oneof(lowerCharArb, digitCharArb, specialCharArb)
  const missingUpperArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) => fc.array(noUpperCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[A-Z]/.test(pw)
    )

  it('should return { valid: false } for passwords missing uppercase letter', () => {
    fc.assert(
      fc.property(missingUpperArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Missing lowercase: has uppercase, digit, special but NO lowercase
  const noLowerCharArb = fc.oneof(upperCharArb, digitCharArb, specialCharArb)
  const missingLowerArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) => fc.array(noLowerCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[a-z]/.test(pw)
    )

  it('should return { valid: false } for passwords missing lowercase letter', () => {
    fc.assert(
      fc.property(missingLowerArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Missing digit: has uppercase, lowercase, special but NO digit
  const noDigitCharArb = fc.oneof(upperCharArb, lowerCharArb, specialCharArb)
  const missingDigitArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) => fc.array(noDigitCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[0-9]/.test(pw)
    )

  it('should return { valid: false } for passwords missing digit', () => {
    fc.assert(
      fc.property(missingDigitArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // Missing special char: has uppercase, lowercase, digit but NO special character
  const noSpecialCharArb = fc.oneof(upperCharArb, lowerCharArb, digitCharArb)
  const missingSpecialArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) => fc.array(noSpecialCharArb, { minLength: len, maxLength: len }))
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && !/[^A-Za-z0-9]/.test(pw)
    )

  it('should return { valid: false } for passwords missing special character', () => {
    fc.assert(
      fc.property(missingSpecialArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
