/**
 * Event registration page orchestration module.
 * Handles reading event ID from URL, form submission, API calls,
 * and UI state management for guest event registration.
 */

import { registerGuest } from './api-client.js'

/**
 * Validates whether a string conforms to UUID format (versions 1–5).
 * @param {string} str - The string to validate.
 * @returns {boolean} `true` if the string is a valid UUID, `false` otherwise.
 */
export function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Initializes event registration page behavior.
 * Reads eventId from query params, populates event details,
 * and attaches form submit handler.
 */
export function initEventRegistration() {
  const params = new URLSearchParams(window.location.search)
  const eventId = params.get('eventId')
  const eventName = params.get('eventName')

  const form = document.getElementById('eventRegistrationForm')
  const successAlert = document.getElementById('successAlert')
  const errorAlert = document.getElementById('errorAlert')
  const pageTitle = document.getElementById('pageTitle')
  const pageLead = document.getElementById('pageLead')
  const eventNameEl = document.getElementById('eventName')
  const eventDetails = document.getElementById('eventDetails')

  // Populate event name if provided via query param
  if (eventName) {
    const decoded = decodeURIComponent(eventName)
    if (pageTitle) pageTitle.textContent = `Register — ${decoded}`
    if (eventNameEl) eventNameEl.textContent = decoded
    document.title = `${decoded} — Registration — AFEDEV`
  } else {
    if (eventNameEl) eventNameEl.textContent = 'Event Registration'
  }

  // Populate event meta from query params if available
  const eventDate = params.get('eventDate')
  const eventTime = params.get('eventTime')
  const eventVenue = params.get('eventVenue')

  if (eventDate) {
    const dateEl = document.getElementById('eventDate')
    if (dateEl) dateEl.textContent = eventDate
  }
  if (eventTime) {
    const timeEl = document.getElementById('eventTime')
    if (timeEl) timeEl.textContent = eventTime
  }
  if (eventVenue) {
    const venueEl = document.getElementById('eventVenue')
    if (venueEl) venueEl.textContent = eventVenue
  }

  // Hide event details panel if no info available
  if (!eventName && !eventDate && !eventTime && !eventVenue) {
    if (eventDetails) eventDetails.classList.add('d-none')
  }

  // If no eventId, show error and hide form
  if (!eventId) {
    showGeneralError(errorAlert, 'No event specified. Please access this page from an event listing.')
    if (form) form.classList.add('d-none')
    if (eventDetails) eventDetails.classList.add('d-none')
    if (pageLead) pageLead.textContent = 'This page requires an event reference to register.'
    return
  }

  // If eventId is present but not a valid UUID format, block registration
  if (!isValidUUID(eventId)) {
    showGeneralError(errorAlert, 'This event link is invalid. Please return to the events page and try again.')
    if (form) form.classList.add('d-none')
    if (eventDetails) eventDetails.classList.add('d-none')
    if (pageLead) pageLead.textContent = 'The event link you followed appears to be broken.'
    return
  }

  if (!form) return

  const submitBtn = form.querySelector('button[type="submit"]')
  const spinner = submitBtn?.querySelector('.spinner-border')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear previous errors
    clearErrors(form, errorAlert)

    // Collect field values
    const name = (form.elements.name?.value || '').trim()
    const email = (form.elements.email?.value || '').trim()
    const phone = (form.elements.phone?.value || '').trim()

    // Client-side validation
    const errors = validateFields({ name, email, phone })

    if (errors.size > 0) {
      form.classList.add('was-validated')
      displayFieldErrors(form, errors)
      return
    }

    // Start loading state
    setLoadingState(submitBtn, spinner, true)

    // Call API
    const result = await registerGuest(eventId, { name, email, phone })

    if (result.ok) {
      // Success: hide form, show success message
      form.classList.add('d-none')
      if (successAlert) {
        successAlert.innerHTML = `
          <strong>You're registered!</strong><br>
          A confirmation will be sent to <strong>${escapeHtml(email)}</strong>. We look forward to seeing you at the event.
        `
        successAlert.classList.remove('d-none')
      }
    } else {
      // Error: re-enable submit
      setLoadingState(submitBtn, spinner, false)
      handleError(form, errorAlert, result)
    }
  })
}

/**
 * Validates registration form fields.
 * @param {{ name: string, email: string, phone: string }} fields
 * @returns {Map<string, string>} Map of fieldName → error message
 */
function validateFields({ name, email, phone }) {
  const errors = new Map()

  if (!name) {
    errors.set('name', 'Full name is required.')
  } else if (name.length > 100) {
    errors.set('name', 'Name must be 100 characters or fewer.')
  }

  if (!email) {
    errors.set('email', 'Email address is required.')
  } else if (email.length > 255) {
    errors.set('email', 'Email must be 255 characters or fewer.')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.set('email', 'Please enter a valid email address.')
  }

  if (phone && phone.length > 20) {
    errors.set('phone', 'Phone number must be 20 characters or fewer.')
  }

  return errors
}

/**
 * Clears all previous validation errors from the form.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} errorAlert
 */
function clearErrors(form, errorAlert) {
  form.classList.remove('was-validated')

  const invalidFields = form.querySelectorAll('.is-invalid')
  invalidFields.forEach((field) => field.classList.remove('is-invalid'))

  const feedbacks = form.querySelectorAll('.invalid-feedback')
  feedbacks.forEach((el) => {
    el.textContent = ''
    el.style.display = ''
  })

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
  if (result.errorType === 'network' || result.errorType === 'timeout') {
    showGeneralError(errorAlert, 'Unable to connect to the server. Please check your connection and try again.')
    return
  }

  if (result.errorType === 'api' && result.error) {
    const status = result.error.status

    // 409 Conflict — already registered
    if (status === 409) {
      showGeneralError(errorAlert, 'You are already registered for this event. Check your email for confirmation details.')
      return
    }

    // 404 — event not found
    if (status === 404) {
      showGeneralError(errorAlert, 'This event could not be found. It may have been removed or the link is invalid.')
      return
    }

    // 400 — validation errors
    if (status === 400) {
      if (result.error.errors && typeof result.error.errors === 'object') {
        // Handle errors as object (field → message)
        const fieldMap = { name: 'name', email: 'email', phone: 'phone' }
        const unmapped = []

        const errorEntries = Array.isArray(result.error.errors)
          ? result.error.errors
          : Object.entries(result.error.errors).map(([field, message]) => ({ field, message }))

        for (const fieldError of errorEntries) {
          if (fieldMap[fieldError.field]) {
            const field = form.elements[fieldError.field]
            if (field) {
              field.classList.add('is-invalid')
              const feedback = field.parentElement?.querySelector('.invalid-feedback')
              if (feedback) {
                feedback.textContent = fieldError.message
              }
            }
          } else {
            unmapped.push(fieldError.message)
          }
        }

        if (unmapped.length > 0) {
          showGeneralError(errorAlert, unmapped.join('. '))
        }
        return
      }

      showGeneralError(errorAlert, result.error.message || 'Please check your details and try again.')
      return
    }

    // 500 or other
    showGeneralError(errorAlert, 'Something went wrong. Please try again later.')
    return
  }

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

/**
 * Escapes HTML entities to prevent XSS in dynamic content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}
