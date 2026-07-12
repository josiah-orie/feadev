import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../js/api-client.js')
vi.mock('../js/form-validator.js')

import { registerUser } from '../js/api-client.js'
import { validateRegistrationForm } from '../js/form-validator.js'
import { initRegistration } from '../js/registration.js'

function setupDOM() {
  document.body.innerHTML = ''
  document.body.dataset.page = 'register-athlete'
  document.body.innerHTML = `
    <form id="registrationForm">
      <div class="mb-3">
        <input name="email" id="email" value="test@example.com" />
        <div class="invalid-feedback" aria-live="polite"></div>
      </div>
      <div class="mb-3">
        <input name="phoneNumber" id="phoneNumber" value="+2341234567890" />
        <div class="invalid-feedback" aria-live="polite"></div>
      </div>
      <div class="mb-3">
        <input name="password" id="password" value="Aa1!aaaa" />
        <div class="invalid-feedback" aria-live="polite"></div>
      </div>
      <div class="mb-3">
        <input name="confirmPassword" id="confirmPassword" value="Aa1!aaaa" />
        <div class="invalid-feedback" aria-live="polite"></div>
      </div>
      <button type="submit" class="btn btn-brand">Register <span class="spinner-border spinner-border-sm d-none"></span></button>
    </form>
    <div id="successAlert" class="alert alert-success d-none" aria-live="polite"></div>
    <div id="errorAlert" class="alert alert-danger d-none" aria-live="polite"></div>
  `
}

describe('Registration orchestration', () => {
  beforeEach(() => {
    setupDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete document.body.dataset.page
  })

  describe('valid submit → success', () => {
    it('hides form and shows success alert on successful registration', async () => {
      validateRegistrationForm.mockReturnValue(new Map())
      registerUser.mockResolvedValue({
        ok: true,
        data: { id: '123', email: 'test@example.com', role: 'ROLE_ATHLETE', status: 'PENDING_VERIFICATION' },
        error: null,
        errorType: null,
      })

      initRegistration()

      const form = document.getElementById('registrationForm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      // Wait for async submit handler to complete
      await vi.waitFor(() => {
        expect(form.classList.contains('d-none')).toBe(true)
      })

      const successAlert = document.getElementById('successAlert')
      expect(successAlert.classList.contains('d-none')).toBe(false)
      expect(successAlert.textContent).toContain('verification email')
    })
  })

  describe('loading state during API call', () => {
    it('disables button and shows spinner while API request is pending', async () => {
      validateRegistrationForm.mockReturnValue(new Map())

      let resolveRegister
      registerUser.mockImplementation(() => new Promise((resolve) => {
        resolveRegister = resolve
      }))

      initRegistration()

      const form = document.getElementById('registrationForm')
      const submitBtn = form.querySelector('button[type="submit"]')
      const spinner = submitBtn.querySelector('.spinner-border')

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      // Allow microtask queue to flush (validation is sync, loading set before await)
      await vi.waitFor(() => {
        expect(submitBtn.disabled).toBe(true)
      })
      expect(spinner.classList.contains('d-none')).toBe(false)

      // Resolve the pending API call
      resolveRegister({
        ok: true,
        data: { id: '123', email: 'test@example.com', role: 'ROLE_ATHLETE', status: 'PENDING_VERIFICATION' },
        error: null,
        errorType: null,
      })
    })
  })

  describe('success display', () => {
    it('hides form and shows success alert with verification message', async () => {
      validateRegistrationForm.mockReturnValue(new Map())
      registerUser.mockResolvedValue({
        ok: true,
        data: { id: '456', email: 'test@example.com', role: 'ROLE_ATHLETE', status: 'PENDING_VERIFICATION' },
        error: null,
        errorType: null,
      })

      initRegistration()

      const form = document.getElementById('registrationForm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await vi.waitFor(() => {
        expect(form.classList.contains('d-none')).toBe(true)
      })

      const successAlert = document.getElementById('successAlert')
      expect(successAlert.classList.contains('d-none')).toBe(false)
      expect(successAlert.textContent).toContain('verification email')
    })
  })

  describe('validation errors display', () => {
    it('shows field errors and adds was-validated class when validation fails', () => {
      const errors = new Map([
        ['email', 'Please enter a valid email address'],
        ['password', 'Password must be 8–128 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character'],
      ])
      validateRegistrationForm.mockReturnValue(errors)

      initRegistration()

      const form = document.getElementById('registrationForm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      // Form should have was-validated class
      expect(form.classList.contains('was-validated')).toBe(true)

      // Email field should be marked invalid
      const emailInput = document.getElementById('email')
      expect(emailInput.classList.contains('is-invalid')).toBe(true)
      const emailFeedback = emailInput.parentElement.querySelector('.invalid-feedback')
      expect(emailFeedback.textContent).toBe('Please enter a valid email address')

      // Password field should be marked invalid
      const passwordInput = document.getElementById('password')
      expect(passwordInput.classList.contains('is-invalid')).toBe(true)

      // Phone number should NOT be marked invalid
      const phoneInput = document.getElementById('phoneNumber')
      expect(phoneInput.classList.contains('is-invalid')).toBe(false)
    })
  })

  describe('API field errors', () => {
    it('maps API field errors to corresponding form fields', async () => {
      validateRegistrationForm.mockReturnValue(new Map())
      registerUser.mockResolvedValue({
        ok: false,
        data: null,
        errorType: 'api',
        error: {
          timestamp: '2024-01-01T00:00:00Z',
          status: 400,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Already taken' }],
        },
      })

      initRegistration()

      const form = document.getElementById('registrationForm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await vi.waitFor(() => {
        const emailInput = document.getElementById('email')
        expect(emailInput.classList.contains('is-invalid')).toBe(true)
      })

      const emailInput = document.getElementById('email')
      const emailFeedback = emailInput.parentElement.querySelector('.invalid-feedback')
      expect(emailFeedback.textContent).toBe('Already taken')
    })

    it('shows general alert for unmapped field errors', async () => {
      validateRegistrationForm.mockReturnValue(new Map())
      registerUser.mockResolvedValue({
        ok: false,
        data: null,
        errorType: 'api',
        error: {
          timestamp: '2024-01-01T00:00:00Z',
          status: 400,
          message: 'Validation failed',
          errors: [{ field: 'unknownField', message: 'Some server error' }],
        },
      })

      initRegistration()

      const form = document.getElementById('registrationForm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await vi.waitFor(() => {
        const errorAlert = document.getElementById('errorAlert')
        expect(errorAlert.classList.contains('d-none')).toBe(false)
      })

      const errorAlert = document.getElementById('errorAlert')
      expect(errorAlert.textContent).toContain('Some server error')
    })
  })

  describe('resubmission clears previous errors', () => {
    it('clears is-invalid classes and feedback text on resubmission', () => {
      // Set up pre-existing error state
      const emailInput = document.getElementById('email')
      const phoneInput = document.getElementById('phoneNumber')
      emailInput.classList.add('is-invalid')
      phoneInput.classList.add('is-invalid')

      const emailFeedback = emailInput.parentElement.querySelector('.invalid-feedback')
      emailFeedback.textContent = 'Previous error'
      const phoneFeedback = phoneInput.parentElement.querySelector('.invalid-feedback')
      phoneFeedback.textContent = 'Another error'

      const form = document.getElementById('registrationForm')
      form.classList.add('was-validated')

      const errorAlert = document.getElementById('errorAlert')
      errorAlert.classList.remove('d-none')
      errorAlert.textContent = 'A general error'

      // Mock validator to return no errors (valid submission)
      validateRegistrationForm.mockReturnValue(new Map())
      registerUser.mockResolvedValue({
        ok: true,
        data: { id: '789', email: 'test@example.com', role: 'ROLE_ATHLETE', status: 'PENDING_VERIFICATION' },
        error: null,
        errorType: null,
      })

      initRegistration()

      // Trigger resubmission
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      // Previous errors should be cleared
      expect(emailInput.classList.contains('is-invalid')).toBe(false)
      expect(phoneInput.classList.contains('is-invalid')).toBe(false)
      expect(emailFeedback.textContent).toBe('')
      expect(phoneFeedback.textContent).toBe('')
      expect(form.classList.contains('was-validated')).toBe(false)
      expect(errorAlert.classList.contains('d-none')).toBe(true)
      expect(errorAlert.textContent).toBe('')
    })
  })
})
