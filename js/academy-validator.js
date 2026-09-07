/**
 * Pure validation functions for the academy onboarding forms
 * (individual and institution applications).
 * No side effects — each function takes input and returns a result or a
 * Map<fieldName, message> aggregating field-level errors (empty Map = valid).
 *
 * Field names match the corresponding HTML input `name` attributes so the
 * orchestration layer can map errors directly onto form controls.
 */

const REQUIRED_MESSAGE = 'This field is required'
const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address'

/** Allowed `Location` enum values for individual applicants. */
export const LOCATIONS = ['ABUJA', 'LAGOS']

/** Allowed `InstitutionType` enum values for institution applicants. */
export const INSTITUTION_TYPES = [
  'PUBLIC_PRIMARY',
  'PRIVATE_PRIMARY',
  'PUBLIC_SECONDARY',
  'PRIVATE_SECONDARY',
  'UNIVERSITY',
  'POLYTECHNIC',
  'COLLEGE_OF_EDUCATION',
  'OTHER',
]

/** Minimum and maximum accepted age for individual applicants. */
export const MIN_AGE = 5
export const MAX_AGE = 60

/**
 * Validates an email string. Mirrors the rules used across the site.
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: REQUIRED_MESSAGE }
  }

  if (email.length > 254) {
    return { valid: false, message: INVALID_EMAIL_MESSAGE }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: INVALID_EMAIL_MESSAGE }
  }

  return { valid: true, message: '' }
}

/**
 * Validates an applicant age against the accepted range (5–60 inclusive).
 * Accepts numbers or numeric strings; rejects blanks, non-integers, and
 * out-of-range values.
 * @param {number|string} age
 * @returns {{ valid: boolean, message: string }}
 */
export function validateAge(age) {
  if (age === '' || age === null || age === undefined) {
    return { valid: false, message: REQUIRED_MESSAGE }
  }

  const str = String(age).trim()
  if (str === '') {
    return { valid: false, message: REQUIRED_MESSAGE }
  }

  // Must be a whole number (no decimals, no letters)
  if (!/^\d+$/.test(str)) {
    return { valid: false, message: `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}` }
  }

  const num = Number(str)
  if (num < MIN_AGE || num > MAX_AGE) {
    return { valid: false, message: `Age must be between ${MIN_AGE} and ${MAX_AGE}` }
  }

  return { valid: true, message: '' }
}

/**
 * Checks that a value is one of the allowed enum options.
 * @param {string} value
 * @param {string[]} allowed
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEnum(value, allowed) {
  if (!value || !String(value).trim()) {
    return { valid: false, message: REQUIRED_MESSAGE }
  }
  if (!allowed.includes(value)) {
    return { valid: false, message: 'Please select a valid option' }
  }
  return { valid: true, message: '' }
}

/**
 * Adds required-field errors for the nested address object to the given Map.
 * Address field names are namespaced with the `address.` prefix to match the
 * HTML inputs (e.g. `address.country`).
 * @param {Map<string, string>} errors
 * @param {{ country?: string, state?: string, lgaOrProvince?: string, streetAddress?: string }} address
 */
function validateAddress(errors, address = {}) {
  const fields = ['country', 'state', 'lgaOrProvince', 'streetAddress']
  for (const field of fields) {
    const value = address[field]
    if (!value || !String(value).trim()) {
      errors.set(`address.${field}`, REQUIRED_MESSAGE)
    }
  }
}

/**
 * Validates an individual academy application.
 * @param {{ fullName: string, age: number|string, email: string, phone: string, location: string, address: object }} fields
 * @returns {Map<string, string>} field name → error message (empty = valid)
 */
export function validateIndividualApplication(fields) {
  const errors = new Map()

  if (!fields.fullName || !fields.fullName.trim()) {
    errors.set('fullName', REQUIRED_MESSAGE)
  }

  const ageResult = validateAge(fields.age)
  if (!ageResult.valid) {
    errors.set('age', ageResult.message)
  }

  const emailResult = validateEmail(fields.email)
  if (!emailResult.valid) {
    errors.set('email', emailResult.message)
  }

  if (!fields.phone || !fields.phone.trim()) {
    errors.set('phone', REQUIRED_MESSAGE)
  }

  const locationResult = validateEnum(fields.location, LOCATIONS)
  if (!locationResult.valid) {
    errors.set('location', locationResult.message)
  }

  validateAddress(errors, fields.address)

  return errors
}

/**
 * Validates an institution academy application.
 * @param {{ institutionType: string, name: string, contactEmail: string, contactPhone: string, address: object }} fields
 * @returns {Map<string, string>} field name → error message (empty = valid)
 */
export function validateInstitutionApplication(fields) {
  const errors = new Map()

  const typeResult = validateEnum(fields.institutionType, INSTITUTION_TYPES)
  if (!typeResult.valid) {
    errors.set('institutionType', typeResult.message)
  }

  if (!fields.name || !fields.name.trim()) {
    errors.set('name', REQUIRED_MESSAGE)
  }

  const emailResult = validateEmail(fields.contactEmail)
  if (!emailResult.valid) {
    errors.set('contactEmail', emailResult.message)
  }

  if (!fields.contactPhone || !fields.contactPhone.trim()) {
    errors.set('contactPhone', REQUIRED_MESSAGE)
  }

  validateAddress(errors, fields.address)

  return errors
}
