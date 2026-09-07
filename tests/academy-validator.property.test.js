import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  validateAge,
  validateIndividualApplication,
  validateInstitutionApplication,
  LOCATIONS,
  INSTITUTION_TYPES,
  MIN_AGE,
  MAX_AGE,
} from '../js/academy-validator.js'

const validAddress = {
  country: 'Nigeria',
  state: 'Lagos',
  lgaOrProvince: 'Ikeja',
  streetAddress: '1 Allen Avenue',
}

// Property: age within [MIN_AGE, MAX_AGE] is always valid; outside always invalid
describe('Property: age range enforcement', () => {
  it('accepts every integer age within the inclusive range', () => {
    fc.assert(
      fc.property(fc.integer({ min: MIN_AGE, max: MAX_AGE }), (age) => {
        expect(validateAge(age).valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('rejects every integer age below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -50, max: MIN_AGE - 1 }), (age) => {
        expect(validateAge(age).valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('rejects every integer age above the maximum', () => {
    fc.assert(
      fc.property(fc.integer({ min: MAX_AGE + 1, max: 500 }), (age) => {
        expect(validateAge(age).valid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})

// Property: location outside the enum always produces a location error
describe('Property: individual location enum enforcement', () => {
  const nonEnumStringArb = fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((s) => s.trim().length > 0 && !LOCATIONS.includes(s))

  it('always flags a location that is not in the enum', () => {
    fc.assert(
      fc.property(nonEnumStringArb, (location) => {
        const errors = validateIndividualApplication({
          fullName: 'Ada Obi',
          age: 15,
          email: 'ada@example.com',
          phone: '+2348030000000',
          location,
          address: { ...validAddress },
        })
        expect(errors.has('location')).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('never flags a location that is in the enum', () => {
    fc.assert(
      fc.property(fc.constantFrom(...LOCATIONS), (location) => {
        const errors = validateIndividualApplication({
          fullName: 'Ada Obi',
          age: 15,
          email: 'ada@example.com',
          phone: '+2348030000000',
          location,
          address: { ...validAddress },
        })
        expect(errors.has('location')).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})

// Property: institutionType outside the enum always produces an error
describe('Property: institution type enum enforcement', () => {
  const nonEnumStringArb = fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => s.trim().length > 0 && !INSTITUTION_TYPES.includes(s))

  it('always flags an institution type that is not in the enum', () => {
    fc.assert(
      fc.property(nonEnumStringArb, (institutionType) => {
        const errors = validateInstitutionApplication({
          institutionType,
          name: 'Some School',
          contactEmail: 'contact@example.com',
          contactPhone: '+2348050000000',
          address: { ...validAddress },
        })
        expect(errors.has('institutionType')).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('never flags an institution type that is in the enum', () => {
    fc.assert(
      fc.property(fc.constantFrom(...INSTITUTION_TYPES), (institutionType) => {
        const errors = validateInstitutionApplication({
          institutionType,
          name: 'Some School',
          contactEmail: 'contact@example.com',
          contactPhone: '+2348050000000',
          address: { ...validAddress },
        })
        expect(errors.has('institutionType')).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
