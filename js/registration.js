/**
 * Registration form orchestration module.
 * Handles form submission, validation display, API calls, and UI state management
 * for both athlete and coach registration pages.
 */

import { validateRegistrationForm } from './form-validator.js'
import { registerUser } from './api-client.js'

/**
 * Initializes registration form behavior for the current page.
 * Determines role from document.body.dataset.page.
 * Attaches submit handler, manages UI states (loading, success, error).
 */
export function initRegistration() {
  const page = document.body.dataset.page || ''
  let role = null

  if (page === 'register-athlete') {
    role = 'athlete'
  } else if (page === 'register-coach') {
    role = 'coach'
  } else {
    return
  }

  const form = document.getElementById('registrationForm')
  if (!form) return

  const submitBtn = form.querySelector('button[type="submit"]')
  const spinner = submitBtn?.querySelector('.spinner-border')
  const successAlert = document.getElementById('successAlert')
  const errorAlert = document.getElementById('errorAlert')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear all previous errors on resubmission
    clearErrors(form, errorAlert)

    // Collect field values
    const fields = {
      email: form.elements.email?.value || '',
      phoneNumber: form.elements.phoneNumber?.value || '',
      password: form.elements.password?.value || '',
      confirmPassword: form.elements.confirmPassword?.value || '',
    }

    // Collect additional coach-specific fields
    if (role === 'coach') {
      fields.fullName = form.elements.fullName?.value || ''
      fields.dateOfBirth = form.elements.dateOfBirth?.value || ''
      fields.gender = form.elements.gender?.value || ''
      fields.areaOfInterest = form.elements.areaOfInterest?.value || ''
      fields.availability = form.elements.availability?.value || ''
      fields.americanFootballExperience = form.elements.americanFootballExperience?.value || ''
      fields.involvementLevel = form.elements.involvementLevel?.value || ''

      // Collect coaching interests (checkboxes)
      const checkboxes = form.querySelectorAll('input[name="coachingInterests"]:checked')
      fields.coachingInterests = Array.from(checkboxes).map((cb) => cb.value)

      // Optional fields — include only if provided
      const nationality = form.elements.nationality?.value?.trim()
      if (nationality) fields.nationality = nationality

      const stateOfResidence = form.elements.stateOfResidence?.value?.trim()
      if (stateOfResidence) fields.stateOfResidence = stateOfResidence

      const currentSport = form.elements.currentSport?.value?.trim()
      if (currentSport) fields.currentSport = currentSport

      const currentOrganization = form.elements.currentOrganization?.value?.trim()
      if (currentOrganization) fields.currentOrganization = currentOrganization

      const currentPosition = form.elements.currentPosition?.value?.trim()
      if (currentPosition) fields.currentPosition = currentPosition

      const yearsOfExperience = form.elements.yearsOfExperience?.value
      if (yearsOfExperience !== '' && yearsOfExperience != null) {
        fields.yearsOfExperience = parseInt(yearsOfExperience, 10)
      }
    }

    // Run client-side validation
    const errors = validateRegistrationForm(fields, role)

    if (errors.size > 0) {
      // Display validation errors
      form.classList.add('was-validated')
      displayFieldErrors(form, errors)
      return
    }

    // Start loading state
    setLoadingState(submitBtn, spinner, true)

    // Call API
    const result = await registerUser(role, fields)

    if (result.ok) {
      // Success: redirect to verify-email page
      window.location.href = '/verify-email.html?email=' + encodeURIComponent(fields.email)
    } else {
      // Error: re-enable submit, hide spinner
      setLoadingState(submitBtn, spinner, false)
      handleError(form, errorAlert, result)
    }
  })
}

/**
 * Clears all previous validation errors from the form.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} errorAlert
 */
function clearErrors(form, errorAlert) {
  // Remove was-validated class
  form.classList.remove('was-validated')

  // Remove is-invalid from all fields and fieldsets
  const invalidFields = form.querySelectorAll('.is-invalid')
  invalidFields.forEach((field) => field.classList.remove('is-invalid'))

  // Clear all invalid-feedback messages and reset display
  const feedbacks = form.querySelectorAll('.invalid-feedback')
  feedbacks.forEach((el) => {
    el.textContent = ''
    el.style.display = ''
  })

  // Hide general error alert
  if (errorAlert) {
    errorAlert.textContent = ''
    errorAlert.classList.add('d-none')
  }
}

/**
 * Displays field-level validation errors on the form.
 * @param {HTMLFormElement} form
 * @param {Map<string, string>} errors
 */
function displayFieldErrors(form, errors) {
  for (const [fieldName, message] of errors) {
    // Special handling for coachingInterests (fieldset with checkboxes)
    if (fieldName === 'coachingInterests') {
      const fieldset = form.querySelector('fieldset')
      if (fieldset) {
        fieldset.classList.add('is-invalid')
        const feedback = fieldset.querySelector('.invalid-feedback')
        if (feedback) {
          feedback.textContent = message
          feedback.style.display = 'block'
        }
      }
      continue
    }

    const field = form.elements[fieldName]
    if (field) {
      field.classList.add('is-invalid')
      const feedback = field.parentElement?.querySelector('.invalid-feedback')
      if (feedback) {
        feedback.textContent = message
      }
    }
  }
}

/**
 * Sets the loading state on the submit button.
 * @param {HTMLButtonElement|null} submitBtn
 * @param {HTMLElement|null} spinner
 * @param {boolean} loading
 */
function setLoadingState(submitBtn, spinner, loading) {
  if (submitBtn) {
    submitBtn.disabled = loading
  }
  if (spinner) {
    if (loading) {
      spinner.classList.remove('d-none')
    } else {
      spinner.classList.add('d-none')
    }
  }
}

/**
 * Handles API error responses and displays appropriate messages.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} errorAlert
 * @param {import('./api-client.js').ApiResponse} result
 */
function handleError(form, errorAlert, result) {
  // Network or timeout error
  if (result.errorType === 'network' || result.errorType === 'timeout') {
    showGeneralError(errorAlert, 'Unable to connect to the server. Please try again later.')
    return
  }

  // API error
  if (result.errorType === 'api' && result.error) {
    const status = result.error.status

    // 409 Conflict
    if (status === 409) {
      showGeneralError(errorAlert, 'This email or phone number is already registered')
      return
    }

    // 500 or unexpected status
    if (status === 500 || (status !== 400 && status !== 409)) {
      showGeneralError(errorAlert, 'Something went wrong. Please try again later.')
      return
    }

    // 400 with field errors
    if (result.error.errors && result.error.errors.length > 0) {
      const formFieldNames = [
        'email', 'phoneNumber', 'password', 'confirmPassword',
        'fullName', 'dateOfBirth', 'gender', 'nationality', 'stateOfResidence',
        'currentSport', 'currentOrganization', 'currentPosition', 'yearsOfExperience',
        'areaOfInterest', 'availability', 'americanFootballExperience',
        'involvementLevel', 'coachingInterests'
      ]
      const unmappedErrors = []

      for (const fieldError of result.error.errors) {
        if (formFieldNames.includes(fieldError.field)) {
          // Map to the specific form field
          const field = form.elements[fieldError.field]
          if (field) {
            field.classList.add('is-invalid')
            const feedback = field.parentElement?.querySelector('.invalid-feedback')
            if (feedback) {
              feedback.textContent = fieldError.message
            }
          }
        } else {
          // Unmapped field error goes to general alert
          unmappedErrors.push(fieldError.message)
        }
      }

      if (unmappedErrors.length > 0) {
        showGeneralError(errorAlert, unmappedErrors.join('. '))
      }
    } else {
      // 400 without field errors — show top-level message
      showGeneralError(errorAlert, result.error.message || 'Something went wrong. Please try again later.')
    }
    return
  }

  // Fallback for any other unexpected case
  showGeneralError(errorAlert, 'Something went wrong. Please try again later.')
}

/**
 * Shows a general error message in the error alert container.
 * @param {HTMLElement|null} errorAlert
 * @param {string} message
 */
function showGeneralError(errorAlert, message) {
  if (errorAlert) {
    errorAlert.textContent = message
    errorAlert.classList.remove('d-none')
  }
}
