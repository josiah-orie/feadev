import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateRegistrationForm, validatePassword, validateEmail, validatePasswordMatch } from '../js/form-validator.js'

// Feature: registration-forms, Property 1: Required field validation completeness
// **Validates: Requirements 4.1**
describe('Property 1: Required field validation completeness', () => {
  const allFields = ['email', 'phoneNumber', 'password', 'confirmPassword']

  // Generator for empty/whitespace-only strings
  const emptyOrWhitespaceArb = fc.oneof(
    fc.constant(''),
    fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 10 })
      .map((chars) => chars.join(''))
  )

  // Generator for a valid email
  const validEmailArb = fc
    .tuple(
      fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 5 })
    )
    .map(([local, domain, tld]) => `${local.join('')}@${domain.join('')}.${tld.join('')}`)

  // Generator for a valid phone number (non-empty, non-whitespace)
  const validPhoneArb = fc
    .tuple(
      fc.constantFrom('+234', '+1', '+44'),
      fc.array(fc.constantFrom(...'0123456789'.split('')), { minLength: 7, maxLength: 11 })
    )
    .map(([prefix, digits]) => `${prefix}${digits.join('')}`)

  // Generator for a valid password meeting all Password_Rules
  const validPasswordArb = fc
    .tuple(
      fc.integer({ min: 8, max: 30 }),
      fc.integer({ min: 65, max: 90 }).map((c) => String.fromCharCode(c)),
      fc.integer({ min: 97, max: 122 }).map((c) => String.fromCharCode(c)),
      fc.integer({ min: 48, max: 57 }).map((c) => String.fromCharCode(c)),
      fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*')
    )
    .chain(([len, upper, lower, digit, special]) => {
      const mandatory = [upper, lower, digit, special]
      const remaining = Math.max(0, len - mandatory.length)
      return fc
        .array(
          fc.integer({ min: 33, max: 126 }).map((c) => String.fromCharCode(c)),
          { minLength: remaining, maxLength: remaining }
        )
        .map((filler) => {
          const allChars = [...mandatory, ...filler]
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

  it('returns errors for exactly the fields that are empty/whitespace and no errors for valid fields', () => {
    fc.assert(
      fc.property(
        // Pick a non-empty subset of fields to make empty
        fc.subarray(allFields, { minLength: 1 }),
        // Generate empty/whitespace values for each field slot
        fc.array(emptyOrWhitespaceArb, { minLength: 4, maxLength: 4 }),
        // Generate valid values for non-empty fields
        validEmailArb,
        validPhoneArb,
        validPasswordArb,
        (emptyFields, emptyValues, validEmail, validPhone, validPassword) => {
          // Build form: empty fields get whitespace/empty, others get valid values
          const fields = {
            email: emptyFields.includes('email') ? emptyValues[0] : validEmail,
            phoneNumber: emptyFields.includes('phoneNumber') ? emptyValues[1] : validPhone,
            password: emptyFields.includes('password') ? emptyValues[2] : validPassword,
            confirmPassword: emptyFields.includes('confirmPassword')
              ? emptyValues[3]
              : validPassword,
          }

          const errors = validateRegistrationForm(fields)

          // Every empty field must have an error
          for (const field of emptyFields) {
            expect(errors.has(field), `Expected error for empty field "${field}"`).toBe(true)
          }

          // Fields with valid non-empty values must NOT have an error,
          // EXCEPT confirmPassword which depends on password being valid too
          // (if password is empty, confirmPassword won't match it)
          const independentFields = ['email', 'phoneNumber', 'password']
          for (const field of independentFields) {
            if (!emptyFields.includes(field)) {
              expect(
                errors.has(field),
                `Unexpected error for valid field "${field}": ${errors.get(field)}`
              ).toBe(false)
            }
          }

          // confirmPassword should be error-free only when both password and
          // confirmPassword are valid (non-empty) and they match
          if (!emptyFields.includes('confirmPassword') && !emptyFields.includes('password')) {
            expect(
              errors.has('confirmPassword'),
              `Unexpected error for valid field "confirmPassword": ${errors.get('confirmPassword')}`
            ).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


// Feature: registration-forms, Property 3: Password rule enforcement
// **Validates: Requirements 4.3**
describe('Property 3: Password rule enforcement', () => {
  // Helper arbitraries for individual character categories
  const upperCharArb = fc.integer({ min: 65, max: 90 }).map((c) => String.fromCharCode(c))
  const lowerCharArb = fc.integer({ min: 97, max: 122 }).map((c) => String.fromCharCode(c))
  const digitCharArb = fc.integer({ min: 48, max: 57 }).map((c) => String.fromCharCode(c))
  // Special characters: printable ASCII that are not letters or digits
  const specialCharArb = fc.oneof(
    fc.integer({ min: 33, max: 47 }).map((c) => String.fromCharCode(c)), // ! to /
    fc.integer({ min: 58, max: 64 }).map((c) => String.fromCharCode(c)), // : to @
    fc.integer({ min: 91, max: 96 }).map((c) => String.fromCharCode(c)), // [ to `
    fc.integer({ min: 123, max: 126 }).map((c) => String.fromCharCode(c)) // { to ~
  )
  // Any printable ASCII character (33-126)
  const printableCharArb = fc.integer({ min: 33, max: 126 }).map((c) => String.fromCharCode(c))

  // Generates a valid password: 8-128 chars containing at least one uppercase,
  // one lowercase, one digit, and one special character
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
          // Shuffle using a deterministic approach based on array indices
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

  // --- Invalid password generators (each violates at least one rule) ---

  // Too short: 1-7 characters (non-whitespace-only)
  const tooShortArb = fc
    .integer({ min: 1, max: 7 })
    .chain((len) =>
      fc.array(printableCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))
    .filter((pw) => pw.trim().length > 0)

  // Too long: 129-200 characters
  const tooLongArb = fc
    .integer({ min: 129, max: 200 })
    .chain((len) =>
      fc.array(printableCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))

  // Missing uppercase: 8-50 chars with lowercase, digit, special but NO uppercase
  const noUpperCharArb = fc.oneof(lowerCharArb, digitCharArb, specialCharArb)
  const missingUpperArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) =>
      fc.array(noUpperCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[A-Z]/.test(pw)
    )

  // Missing lowercase: 8-50 chars with uppercase, digit, special but NO lowercase
  const noLowerCharArb = fc.oneof(upperCharArb, digitCharArb, specialCharArb)
  const missingLowerArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) =>
      fc.array(noLowerCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[a-z]/.test(pw)
    )

  // Missing digit: 8-50 chars with uppercase, lowercase, special but NO digit
  const noDigitCharArb = fc.oneof(upperCharArb, lowerCharArb, specialCharArb)
  const missingDigitArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) =>
      fc.array(noDigitCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[^A-Za-z0-9]/.test(pw) && !/[0-9]/.test(pw)
    )

  // Missing special char: 8-50 chars with uppercase, lowercase, digit but NO special
  const noSpecialCharArb = fc.oneof(upperCharArb, lowerCharArb, digitCharArb)
  const missingSpecialArb = fc
    .integer({ min: 8, max: 50 })
    .chain((len) =>
      fc.array(noSpecialCharArb, { minLength: len, maxLength: len })
    )
    .map((chars) => chars.join(''))
    .filter(
      (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && !/[^A-Za-z0-9]/.test(pw)
    )

  it('should return { valid: false } for passwords that are too short (< 8 chars)', () => {
    fc.assert(
      fc.property(tooShortArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for passwords that are too long (> 128 chars)', () => {
    fc.assert(
      fc.property(tooLongArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for passwords missing uppercase letter', () => {
    fc.assert(
      fc.property(missingUpperArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for passwords missing lowercase letter', () => {
    fc.assert(
      fc.property(missingLowerArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for passwords missing digit', () => {
    fc.assert(
      fc.property(missingDigitArb, (password) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

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


// Feature: registration-forms, Property 2: Email validation correctness
// **Validates: Requirements 4.2**
describe('Property 2: Email validation correctness', () => {
  // Characters allowed in the local part of an email (simplified safe subset)
  const localChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_%+-'.split('')

  // Characters allowed in domain labels
  const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')

  // Characters allowed in TLD (letters only)
  const tldChars = 'abcdefghijklmnopqrstuvwxyz'.split('')

  // Generator for valid emails: local@domain.tld, total ≤254 chars
  const validEmailArb = fc
    .tuple(
      fc.array(fc.constantFrom(...localChars), { minLength: 1, maxLength: 50 }),
      fc.array(fc.constantFrom(...domainChars), { minLength: 1, maxLength: 50 }),
      fc.array(fc.constantFrom(...tldChars), { minLength: 2, maxLength: 10 })
    )
    .map(([local, domain, tld]) => `${local.join('')}@${domain.join('')}.${tld.join('')}`)
    .filter((email) => email.length <= 254)

  // Generator for invalid emails: missing @
  const missingAtArb = fc
    .array(fc.constantFrom(...localChars, ...domainChars), { minLength: 1, maxLength: 50 })
    .map((chars) => chars.join(''))
    .filter((s) => !s.includes('@') && s.trim().length > 0)

  // Generator for invalid emails: missing domain dot (has @ but no dot after it)
  const missingDomainDotArb = fc
    .tuple(
      fc.array(fc.constantFrom(...localChars), { minLength: 1, maxLength: 20 }),
      fc.array(fc.constantFrom(...domainChars), { minLength: 1, maxLength: 20 })
    )
    .map(([local, domain]) => `${local.join('')}@${domain.join('')}`)
    .filter((email) => {
      const afterAt = email.split('@')[1]
      return afterAt && !afterAt.includes('.')
    })

  // Generator for invalid emails: >254 chars
  const tooLongEmailArb = fc
    .tuple(
      fc.array(fc.constantFrom(...localChars), { minLength: 200, maxLength: 230 }),
      fc.array(fc.constantFrom(...domainChars), { minLength: 10, maxLength: 20 }),
      fc.array(fc.constantFrom(...tldChars), { minLength: 2, maxLength: 5 })
    )
    .map(([local, domain, tld]) => `${local.join('')}@${domain.join('')}.${tld.join('')}`)
    .filter((email) => email.length > 254)

  // Generator for invalid emails: contains spaces
  const withSpacesArb = fc
    .tuple(
      fc.array(fc.constantFrom(...localChars), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...domainChars), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...tldChars), { minLength: 2, maxLength: 5 })
    )
    .map(([local, domain, tld]) => `${local.join('')} @${domain.join('')}.${tld.join('')}`)

  // Generator for invalid emails: multiple @ signs
  const multipleAtArb = fc
    .tuple(
      fc.array(fc.constantFrom(...localChars), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...localChars), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...domainChars), { minLength: 1, maxLength: 10 }),
      fc.array(fc.constantFrom(...tldChars), { minLength: 2, maxLength: 5 })
    )
    .map(([local1, local2, domain, tld]) => `${local1.join('')}@${local2.join('')}@${domain.join('')}.${tld.join('')}`)

  it('should return { valid: true } for valid email addresses (local@domain.tld, ≤254 chars)', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for emails missing @ symbol', () => {
    fc.assert(
      fc.property(missingAtArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for emails missing domain dot', () => {
    fc.assert(
      fc.property(missingDomainDotArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for emails exceeding 254 characters', () => {
    fc.assert(
      fc.property(tooLongEmailArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for emails containing spaces', () => {
    fc.assert(
      fc.property(withSpacesArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false } for emails with multiple @ signs', () => {
    fc.assert(
      fc.property(multipleAtArb, (email) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})


// Feature: registration-forms, Property 4: Password match validation
// **Validates: Requirements 4.4**
describe('Property 4: Password match validation', () => {
  // Generator for non-empty strings (to avoid "This field is required" path)
  const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)

  it('should return { valid: true } when both strings are equal and non-empty', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (password) => {
        const result = validatePasswordMatch(password, password)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should return { valid: false, message: "Passwords do not match" } when strings differ', () => {
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
