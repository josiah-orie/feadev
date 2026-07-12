import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

// Feature: registration-forms, Property 6: Error response field mapping
// **Validates: Requirements 8.1**

describe('Property 6: Error response field mapping', () => {
  const KNOWN_FIELDS = ['email', 'phoneNumber', 'password', 'confirmPassword']

  // Generator for known form field names
  const knownFieldArb = fc.constantFrom(...KNOWN_FIELDS)

  // Generator for unknown field names (not matching any form field)
  const unknownFieldArb = fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => !KNOWN_FIELDS.includes(s) && s.trim().length > 0)

  // Generator for an error message
  const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0)

  // Generator for a field error targeting a known field
  const knownFieldErrorArb = fc.tuple(knownFieldArb, errorMessageArb).map(([field, message]) => ({
    field,
    message,
  }))

  // Generator for a field error targeting an unknown field
  const unknownFieldErrorArb = fc.tuple(unknownFieldArb, errorMessageArb).map(([field, message]) => ({
    field,
    message,
  }))

  // Generator for a mixed array of errors (at least 1 error total)
  const errorArrayArb = fc
    .tuple(
      fc.array(knownFieldErrorArb, { minLength: 0, maxLength: 5 }),
      fc.array(unknownFieldErrorArb, { minLength: 0, maxLength: 5 })
    )
    .filter(([known, unknown]) => known.length + unknown.length > 0)
    .map(([known, unknown]) => [...known, ...unknown])
    // Shuffle so order is random
    .chain((errors) =>
      fc.shuffledSubarray(errors, { minLength: errors.length, maxLength: errors.length })
    )

  function setupDOM() {
    document.body.innerHTML = ''
    document.body.dataset.page = 'register-athlete'

    document.body.innerHTML = `
      <div id="successAlert" class="alert alert-success d-none" aria-live="polite"></div>
      <div id="errorAlert" class="alert alert-danger d-none" aria-live="polite"></div>
      <form id="registrationForm" class="registration-form" novalidate>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" name="email" required />
          <div class="invalid-feedback" aria-live="polite"></div>
        </div>
        <div class="mb-3">
          <label for="phoneNumber" class="form-label">Phone Number</label>
          <input type="tel" class="form-control" id="phoneNumber" name="phoneNumber" required />
          <div class="invalid-feedback" aria-live="polite"></div>
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" name="password" required />
          <div class="invalid-feedback" aria-live="polite"></div>
        </div>
        <div class="mb-3">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input type="password" class="form-control" id="confirmPassword" name="confirmPassword" required />
          <div class="invalid-feedback" aria-live="polite"></div>
        </div>
        <button type="submit" class="btn btn-brand w-100">Register <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span></button>
      </form>
    `
  }

  beforeEach(() => {
    vi.resetModules()
    setupDOM()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('routes field-matching errors to field feedback elements and non-matching errors to general alert', async () => {
    await fc.assert(
      fc.asyncProperty(errorArrayArb, async (errors) => {
        // Reset DOM for each iteration
        setupDOM()
        vi.resetModules()

        // Mock validateRegistrationForm to return empty Map (pass validation)
        vi.doMock('../js/form-validator.js', () => ({
          validateRegistrationForm: () => new Map(),
        }))

        // Mock fetch to return 400 with the generated errors
        const mockResponse = {
          ok: false,
          status: 400,
          json: async () => ({
            timestamp: new Date().toISOString(),
            status: 400,
            message: 'Validation failed',
            errors,
          }),
        }
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

        // Dynamically import registration module (after mocks are set up)
        const { initRegistration } = await import('../js/registration.js')
        initRegistration()

        // Fill form fields with valid data so they pass through
        const form = document.getElementById('registrationForm')
        form.elements.email.value = 'test@example.com'
        form.elements.phoneNumber.value = '+2341234567890'
        form.elements.password.value = 'ValidPass1!'
        form.elements.confirmPassword.value = 'ValidPass1!'

        // Submit the form
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
        form.dispatchEvent(submitEvent)

        // Wait for async handler to complete
        await new Promise((resolve) => setTimeout(resolve, 0))

        // Partition errors into known and unknown
        const knownErrors = errors.filter((e) => KNOWN_FIELDS.includes(e.field))
        const unknownErrors = errors.filter((e) => !KNOWN_FIELDS.includes(e.field))

        // Verify: each known-field error should appear in its corresponding .invalid-feedback
        // For duplicate fields, the last one wins since the code iterates and overwrites
        const lastKnownByField = new Map()
        for (const err of knownErrors) {
          lastKnownByField.set(err.field, err.message)
        }

        for (const [fieldName, expectedMessage] of lastKnownByField) {
          const field = form.elements[fieldName]
          expect(field.classList.contains('is-invalid')).toBe(true)
          const feedback = field.parentElement.querySelector('.invalid-feedback')
          expect(feedback.textContent).toBe(expectedMessage)
        }

        // Verify: unknown-field errors should appear in #errorAlert
        const errorAlert = document.getElementById('errorAlert')
        if (unknownErrors.length > 0) {
          expect(errorAlert.classList.contains('d-none')).toBe(false)
          const expectedAlertText = unknownErrors.map((e) => e.message).join('. ')
          expect(errorAlert.textContent).toBe(expectedAlertText)
        } else {
          // If there are no unknown errors, the alert should remain hidden
          // (unless it was shown for another reason, which won't happen here)
          expect(errorAlert.classList.contains('d-none')).toBe(true)
        }

        // Verify: known fields that did NOT get an error should remain clean
        for (const fieldName of KNOWN_FIELDS) {
          if (!lastKnownByField.has(fieldName)) {
            const field = form.elements[fieldName]
            expect(field.classList.contains('is-invalid')).toBe(false)
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})
