import { describe, it, expect } from 'vitest'
import {
  validateAge,
  validateEnum,
  validateIndividualApplication,
  validateInstitutionApplication,
  LOCATIONS,
  INSTITUTION_TYPES,
} from '../js/academy-validator.js'

const validAddress = {
  country: 'Nigeria',
  state: 'Lagos',
  lgaOrProvince: 'Ikeja',
  streetAddress: '1 Allen Avenue',
}

const validIndividual = {
  fullName: 'Ada Obi',
  age: 15,
  email: 'ada.obi@example.com',
  phone: '+2348030000000',
  location: 'LAGOS',
  address: { ...validAddress },
}

const validInstitution = {
  institutionType: 'UNIVERSITY',
  name: 'University of Lagos',
  contactEmail: 'sports@unilag.edu.ng',
  contactPhone: '+2348050000000',
  address: { ...validAddress },
}

describe('validateAge - boundaries', () => {
  it('rejects age 4 (below minimum)', () => {
    expect(validateAge(4).valid).toBe(false)
  })

  it('accepts age 5 (minimum)', () => {
    expect(validateAge(5).valid).toBe(true)
  })

  it('accepts age 60 (maximum)', () => {
    expect(validateAge(60).valid).toBe(true)
  })

  it('rejects age 61 (above maximum)', () => {
    expect(validateAge(61).valid).toBe(false)
  })

  it('accepts numeric strings within range', () => {
    expect(validateAge('15').valid).toBe(true)
  })

  it('rejects empty value with required message', () => {
    const result = validateAge('')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })

  it('rejects non-integer values', () => {
    expect(validateAge('12.5').valid).toBe(false)
    expect(validateAge('abc').valid).toBe(false)
  })
})

describe('validateEnum', () => {
  it('accepts a value in the allowed list', () => {
    expect(validateEnum('LAGOS', LOCATIONS).valid).toBe(true)
  })

  it('rejects a value not in the allowed list', () => {
    expect(validateEnum('KANO', LOCATIONS).valid).toBe(false)
  })

  it('rejects empty with required message', () => {
    const result = validateEnum('', INSTITUTION_TYPES)
    expect(result.valid).toBe(false)
    expect(result.message).toBe('This field is required')
  })
})

describe('validateIndividualApplication', () => {
  it('returns empty Map for a fully valid application', () => {
    const errors = validateIndividualApplication(validIndividual)
    expect(errors.size).toBe(0)
  })

  it('flags every field when the application is empty', () => {
    const errors = validateIndividualApplication({
      fullName: '',
      age: '',
      email: '',
      phone: '',
      location: '',
      address: {},
    })
    expect(errors.has('fullName')).toBe(true)
    expect(errors.has('age')).toBe(true)
    expect(errors.has('email')).toBe(true)
    expect(errors.has('phone')).toBe(true)
    expect(errors.has('location')).toBe(true)
    expect(errors.has('address.country')).toBe(true)
    expect(errors.has('address.state')).toBe(true)
    expect(errors.has('address.lgaOrProvince')).toBe(true)
    expect(errors.has('address.streetAddress')).toBe(true)
  })

  it('flags an invalid email', () => {
    const errors = validateIndividualApplication({ ...validIndividual, email: 'not-an-email' })
    expect(errors.has('email')).toBe(true)
    expect(errors.get('email')).toBe('Please enter a valid email address')
  })

  it('flags an out-of-range age but nothing else', () => {
    const errors = validateIndividualApplication({ ...validIndividual, age: 99 })
    expect(errors.size).toBe(1)
    expect(errors.has('age')).toBe(true)
  })

  it('flags a location outside the enum', () => {
    const errors = validateIndividualApplication({ ...validIndividual, location: 'KANO' })
    expect(errors.has('location')).toBe(true)
  })

  it('flags a single missing address field only', () => {
    const errors = validateIndividualApplication({
      ...validIndividual,
      address: { ...validAddress, streetAddress: '' },
    })
    expect(errors.size).toBe(1)
    expect(errors.has('address.streetAddress')).toBe(true)
  })
})

describe('validateInstitutionApplication', () => {
  it('returns empty Map for a fully valid application', () => {
    const errors = validateInstitutionApplication(validInstitution)
    expect(errors.size).toBe(0)
  })

  it('flags every field when the application is empty', () => {
    const errors = validateInstitutionApplication({
      institutionType: '',
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: {},
    })
    expect(errors.has('institutionType')).toBe(true)
    expect(errors.has('name')).toBe(true)
    expect(errors.has('contactEmail')).toBe(true)
    expect(errors.has('contactPhone')).toBe(true)
    expect(errors.has('address.country')).toBe(true)
  })

  it('flags an invalid contact email', () => {
    const errors = validateInstitutionApplication({ ...validInstitution, contactEmail: 'bad' })
    expect(errors.has('contactEmail')).toBe(true)
  })

  it('flags an institution type outside the enum', () => {
    const errors = validateInstitutionApplication({ ...validInstitution, institutionType: 'NURSERY' })
    expect(errors.has('institutionType')).toBe(true)
  })

  it('accepts every valid institution type enum value', () => {
    for (const type of INSTITUTION_TYPES) {
      const errors = validateInstitutionApplication({ ...validInstitution, institutionType: type })
      expect(errors.size).toBe(0)
    }
  })
})
