/**
 * Pure validation functions for the registration form.
 * No side effects — each function takes input and returns a result object.
 */

/**
 * Validates an email string.
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: 'This field is required' }
  }

  if (email.length > 254) {
    return { valid: false, message: 'Please enter a valid email address' }
  }

  // Basic email format: something@something.something
  // Checks for: at least one char before @, at least one char between @ and dot,
  // at least one char after the last dot, no spaces, only one @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' }
  }

  return { valid: true, message: '' }
}

/**
 * Validates a password against the Password_Rules.
 * Rules: 8–128 characters, at least one uppercase letter, one lowercase letter,
 * one digit, and one special character.
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
  if (!password || !password.trim()) {
    return { valid: false, message: 'This field is required' }
  }

  const errorMessage =
    'Password must be 8–128 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character'

  if (password.length < 8 || password.length > 128) {
    return { valid: false, message: errorMessage }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: errorMessage }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: errorMessage }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: errorMessage }
  }

  // Special character: anything that is not a letter or digit
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: errorMessage }
  }

  return { valid: true, message: '' }
}

/**
 * Checks that password and confirmPassword match.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword || !confirmPassword.trim()) {
    return { valid: false, message: 'This field is required' }
  }

  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' }
  }

  return { valid: true, message: '' }
}

/**
 * Validates all form fields. Returns a map of field name → error message.
 * Empty map means all fields are valid.
 * @param {{ email: string, phoneNumber: string, password: string, confirmPassword: string, [key: string]: any }} fields
 * @param {'athlete'|'coach'} [role='athlete']
 * @returns {Map<string, string>}
 */
export function validateRegistrationForm(fields, role = 'athlete') {
  const errors = new Map()

  // Validate email
  const emailResult = validateEmail(fields.email)
  if (!emailResult.valid) {
    errors.set('email', emailResult.message)
  }

  // Validate phone number (required only)
  if (!fields.phoneNumber || !fields.phoneNumber.trim()) {
    errors.set('phoneNumber', 'This field is required')
  }

  // Validate password
  const passwordResult = validatePassword(fields.password)
  if (!passwordResult.valid) {
    errors.set('password', passwordResult.message)
  }

  // Validate confirm password
  const confirmResult = validatePasswordMatch(fields.password, fields.confirmPassword)
  if (!confirmResult.valid) {
    errors.set('confirmPassword', confirmResult.message)
  }

  // Coach-specific validations
  if (role === 'coach') {
    if (!fields.fullName || !fields.fullName.trim()) {
      errors.set('fullName', 'This field is required')
    }

    if (!fields.dateOfBirth || !fields.dateOfBirth.trim()) {
      errors.set('dateOfBirth', 'This field is required')
    }

    if (!fields.gender || !fields.gender.trim()) {
      errors.set('gender', 'This field is required')
    }

    if (!fields.areaOfInterest || !fields.areaOfInterest.trim()) {
      errors.set('areaOfInterest', 'This field is required')
    }

    if (!fields.availability || !fields.availability.trim()) {
      errors.set('availability', 'This field is required')
    }

    if (!fields.americanFootballExperience || !fields.americanFootballExperience.trim()) {
      errors.set('americanFootballExperience', 'This field is required')
    }

    if (!fields.involvementLevel || !fields.involvementLevel.trim()) {
      errors.set('involvementLevel', 'This field is required')
    }

    if (!fields.coachingInterests || fields.coachingInterests.length === 0) {
      errors.set('coachingInterests', 'Please select at least one coaching interest')
    }
  }

  return errors
}
