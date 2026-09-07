/**
 * Academy registration page orchestration module.
 * Handles the tabbed Individual / Institution application forms:
 * reads the `?type` query param to preselect a tab, collects and validates
 * field values, submits to the public academy onboarding API, manages UI
 * state, shows an inline success panel, and redirects to the academy page.
 */

import {
  validateIndividualApplication,
  validateInstitutionApplication,
} from './academy-validator.js'
import {
  submitIndividualApplication,
  submitInstitutionApplication,
} from './api-client.js'

/** Delay (ms) before redirecting to the academy page after a successful submit. */
export const REDIRECT_DELAY_MS = 10000

/** Address sub-fields, namespaced with `address.` on the form inputs. */
const ADDRESS_FIELDS = ['country', 'state', 'lgaOrProvince', 'streetAddress']

/**
 * Initializes the academy registration page behavior.
 * Wires both forms and activates the correct tab based on `?type`.
 */
export function initAcademyRegistration() {
  const successAlert = document.getElementById('successAlert')
  const errorAlert = document.getElementById('errorAlert')

  activateTabFromQuery()

  const individualForm = document.getElementById('individualForm')
  if (individualForm) {
    wireForm({
      form: individualForm,
      successAlert,
      errorAlert,
      collect: collectIndividualFields,
      validate: validateIndividualApplication,
      submit: submitIndividualApplication,
      getApplicantName: (fields) => fields.fullName,
    })
  }

  const institutionForm = document.getElementById('institutionForm')
  if (institutionForm) {
    wireForm({
      form: institutionForm,
      successAlert,
      errorAlert,
      collect: collectInstitutionFields,
      validate: validateInstitutionApplication,
      submit: submitInstitutionApplication,
      getApplicantName: (fields) => fields.name,
    })
  }
}

/**
 * Activates the Institution tab when the URL contains `?type=institution`.
 * Uses the Bootstrap Tab API when available, otherwise falls back to toggling
 * the relevant classes/attributes directly (e.g. in a test environment).
 */
function activateTabFromQuery() {
  const params = new URLSearchParams(window.location.search)
  const type = (params.get('type') || '').toLowerCase()
  if (type !== 'institution') return

  const trigger = document.getElementById('institution-tab')
  if (!trigger) return

  const bs = typeof window !== 'undefined' ? window.bootstrap : undefined
  if (bs && typeof bs.Tab === 'function') {
    bs.Tab.getOrCreateInstance(trigger).show()
    return
  }

  // Fallback: manually switch active tab + pane.
  switchTabManually('institution-tab', 'institution-pane', ['individual-tab', 'individual-pane'])
}

/**
 * Manually toggles tab button and pane active state (Bootstrap-free fallback).
 * @param {string} activeTabId
 * @param {string} activePaneId
 * @param {[string, string]} inactive - [tabId, paneId] to deactivate
 */
function switchTabManually(activeTabId, activePaneId, [inactiveTabId, inactivePaneId]) {
  const activeTab = document.getElementById(activeTabId)
  const activePane = document.getElementById(activePaneId)
  const inactiveTab = document.getElementById(inactiveTabId)
  const inactivePane = document.getElementById(inactivePaneId)

  if (inactiveTab) {
    inactiveTab.classList.remove('active')
    inactiveTab.setAttribute('aria-selected', 'false')
  }
  if (inactivePane) {
    inactivePane.classList.remove('show', 'active')
  }
  if (activeTab) {
    activeTab.classList.add('active')
    activeTab.setAttribute('aria-selected', 'true')
  }
  if (activePane) {
    activePane.classList.add('show', 'active')
  }
}

/**
 * Attaches the submit handler and shared behavior to a form.
 * @param {Object} cfg
 * @param {HTMLFormElement} cfg.form
 * @param {HTMLElement|null} cfg.successAlert
 * @param {HTMLElement|null} cfg.errorAlert
 * @param {(form: HTMLFormElement) => object} cfg.collect
 * @param {(fields: object) => Map<string,string>} cfg.validate
 * @param {(payload: object) => Promise<import('./api-client.js').ApiResponse>} cfg.submit
 * @param {(fields: object) => string} cfg.getApplicantName
 */
function wireForm({ form, successAlert, errorAlert, collect, validate, submit, getApplicantName }) {
  const submitBtn = form.querySelector('button[type="submit"]')
  const spinner = submitBtn?.querySelector('.spinner-border')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    clearErrors(form, errorAlert)

    const fields = collect(form)
    const errors = validate(fields)

    if (errors.size > 0) {
      form.classList.add('was-validated')
      displayFieldErrors(form, errors)
      return
    }

    setLoadingState(submitBtn, spinner, true)

    const result = await submit(fields)

    if (result.ok) {
      showSuccess(form, successAlert, getApplicantName(fields))
    } else {
      setLoadingState(submitBtn, spinner, false)
      handleError(form, errorAlert, result)
    }
  })
}

/**
 * Reads the individual form field values into a nested payload object.
 * @param {HTMLFormElement} form
 * @returns {object}
 */
function collectIndividualFields(form) {
  const ageRaw = form.elements['age']?.value ?? ''
  const fields = {
    fullName: (form.elements['fullName']?.value || '').trim(),
    age: ageRaw === '' ? '' : Number(ageRaw),
    email: (form.elements['email']?.value || '').trim(),
    phone: (form.elements['phone']?.value || '').trim(),
    location: form.elements['location']?.value || '',
    address: collectAddress(form),
  }
  return fields
}

/**
 * Reads the institution form field values into a nested payload object.
 * @param {HTMLFormElement} form
 * @returns {object}
 */
function collectInstitutionFields(form) {
  return {
    institutionType: form.elements['institutionType']?.value || '',
    name: (form.elements['name']?.value || '').trim(),
    contactEmail: (form.elements['contactEmail']?.value || '').trim(),
    contactPhone: (form.elements['contactPhone']?.value || '').trim(),
    address: collectAddress(form),
  }
}

/**
 * Reads the shared address fieldset (`address.*` inputs) into an object.
 * @param {HTMLFormElement} form
 * @returns {{ country: string, state: string, lgaOrProvince: string, streetAddress: string }}
 */
function collectAddress(form) {
  const address = {}
  for (const field of ADDRESS_FIELDS) {
    address[field] = (form.elements[`address.${field}`]?.value || '').trim()
  }
  return address
}

/**
 * Clears all previous validation errors from the form and the error alert.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} errorAlert
 */
function clearErrors(form, errorAlert) {
  form.classList.remove('was-validated')

  form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'))

  form.querySelectorAll('.invalid-feedback').forEach((el) => {
    el.textContent = ''
    el.style.display = ''
  })

  if (errorAlert) {
    errorAlert.textContent = ''
    errorAlert.classList.add('d-none')
  }
}

/**
 * Displays field-level validation errors on the form. Handles both flat field
 * names (e.g. `email`) and namespaced address names (e.g. `address.country`).
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
        feedback.style.display = 'block'
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
    spinner.classList.toggle('d-none', !loading)
  }
}

/**
 * Shows the inline success panel, hides the tabs and submitted form,
 * and schedules a redirect to the academy page.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} successAlert
 * @param {string} applicantName
 */
function showSuccess(form, successAlert, applicantName) {
  form.classList.add('d-none')

  // Hide the tab navigation so the success message stands alone.
  const tabs = document.getElementById('applicantTabs')
  if (tabs) tabs.classList.add('d-none')

  const name = applicantName ? escapeHtml(applicantName) : 'your application'
  const seconds = Math.round(REDIRECT_DELAY_MS / 1000)

  if (successAlert) {
    successAlert.innerHTML = `
      <strong>Application received!</strong><br>
      Thank you, ${name}. Your application is now pending review, and we'll email you once a decision is made.
      <br><span class="small">Redirecting to the academy page in ${seconds} seconds…</span>
    `
    successAlert.classList.remove('d-none')
  }

  setTimeout(() => {
    window.location.href = '/academy.html'
  }, REDIRECT_DELAY_MS)
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

    // 409 Conflict — an application already exists for this email.
    if (status === 409) {
      showGeneralError(errorAlert, 'An application with this email already exists. If you have already applied, please wait for our team to review it.')
      return
    }

    // 400 — validation errors, mapped to fields where possible.
    if (status === 400) {
      const errorList = normalizeErrors(result.error.errors)
      if (errorList.length > 0) {
        const unmapped = []
        for (const fieldError of errorList) {
          const field = form.elements[fieldError.field]
          if (field) {
            field.classList.add('is-invalid')
            const feedback = field.parentElement?.querySelector('.invalid-feedback')
            if (feedback) {
              feedback.textContent = fieldError.message
              feedback.style.display = 'block'
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

    // 500 or other unexpected status.
    showGeneralError(errorAlert, 'Something went wrong. Please try again later.')
    return
  }

  showGeneralError(errorAlert, 'Something went wrong. Please try again later.')
}

/**
 * Normalizes the API `errors` payload into an array of { field, message }.
 * Accepts either an array or a field→message object.
 * @param {ApiFieldError[]|Record<string,string>|null|undefined} errors
 * @returns {{ field: string, message: string }[]}
 */
function normalizeErrors(errors) {
  if (!errors) return []
  if (Array.isArray(errors)) return errors
  if (typeof errors === 'object') {
    return Object.entries(errors).map(([field, message]) => ({ field, message }))
  }
  return []
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
