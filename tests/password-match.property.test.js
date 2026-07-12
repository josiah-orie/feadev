import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validatePasswordMatch } from '../js/form-validator.js'

// Feature: registration-forms, Property 4: Password match validation
// **Validates: Requirements 4.4**
describe('Property 4: Password match validation', () => {
  // Generator for non-empty strings (at least 1 character)
  const nonEmptyStringArb = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

  it('should return { valid: true } when both passwords are the same non-empty string', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (password) => {
        const result = validatePasswordMatch(password, password)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false, message: "Passwords do not match" } when passwords differ', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,
        nonEmptyStringArb,
        (a, b) => {
          // Ensure the two strings are actually different
          fc.pre(a !== b)

          const result = validatePasswordMatch(a, b)
          expect(result.valid).toBe(false)
          expect(result.message).toBe('Passwords do not match')
        }
      ),
      { numRuns: 100 }
    )
  })
})
