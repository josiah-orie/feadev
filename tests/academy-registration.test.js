import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../js/api-client.js')
vi.mock('../js/academy-validator.js')

import {
  submitIndividualApplication,
  submitInstitutionApplication,
} from '../js/api-client.js'
import {
  validateIndividualApplication,
  validateInstitutionApplication,
} from '../js/academy-validator.js'
import { initAcademyRegistration, REDIRECT_DELAY_MS } from '../js/academy-registration.js'

function addressFields(prefix) {
  return `
    <div class="col-md-6">
      <input name="address.country" id="${prefix}-country" value="Nigeria" />
      <div class="invalid-feedback"></div>
    </div>
    <div class="col-md-6">
      <input name="address.state" id="${prefix}-state" value="Lagos" />
      <div class="invalid-feedback"></div>
    </div>
    <div class="col-md-6">
      <input name="address.lgaOrProvince" id="${prefix}-lga" value="Ikeja" />
      <div class="invalid-feedback"></div>
    </div>
    <div class="col-md-6">
      <input name="address.streetAddress" id="${prefix}-street" value="1 Allen Ave" />
      <div class="invalid-feedback"></div>
    </div>
  `
}

function setupDOM() {
  document.body.innerHTML = ''
  document.body.dataset.page = 'academy-registration'
  document.body.innerHTML = `
    <div id="successAlert" class="alert alert-success d-none"></div>
    <div id="errorAlert" class="alert alert-danger d-none"></div>

    <ul class="nav nav-tabs" id="applicantTabs">
      <li><button class="nav-link active" id="individual-tab" data-bs-target="#individual-pane" aria-selected="true">Individual</button></li>
      <li><button class="nav-link" id="institution-tab" data-bs-target="#institution-pane" aria-selected="false">Institution</button></li>
    </ul>

    <div class="tab-content">
      <div class="tab-pane fade show active" id="individual-pane">
        <form id="individualForm">
          <div class="col-md-6"><input name="fullName" id="ind-fullName" value="Ada Obi" /><div class="invalid-feedback"></div></div>
          <div class="col-md-3"><input name="age" id="ind-age" value="15" /><div class="invalid-feedback"></div></div>
          <div class="col-md-3">
            <select name="location" id="ind-location"><option value="LAGOS" selected>Lagos</option></select>
            <div class="invalid-feedback"></div>
          </div>
          <div class="col-md-6"><input name="email" id="ind-email" value="ada@example.com" /><div class="invalid-feedback"></div></div>
          <div class="col-md-6"><input name="phone" id="ind-phone" value="+2348030000000" /><div class="invalid-feedback"></div></div>
          ${addressFields('ind')}
          <button type="submit" class="btn btn-brand">Submit <span class="spinner-border spinner-border-sm d-none"></span></button>
        </form>
      </div>

      <div class="tab-pane fade" id="institution-pane">
        <form id="institutionForm">
          <div class="col-md-6"><input name="name" id="inst-name" value="University of Lagos" /><div class="invalid-feedback"></div></div>
          <div class="col-md-6">
            <select name="institutionType" id="inst-type"><option value="UNIVERSITY" selected>University</option></select>
            <div class="invalid-feedback"></div>
          </div>
          <div class="col-md-6"><input name="contactEmail" id="inst-email" value="sports@unilag.edu.ng" /><div class="invalid-feedback"></div></div>
          <div class="col-md-6"><input name="contactPhone" id="inst-phone" value="+2348050000000" /><div class="invalid-feedback"></div></div>
          ${addressFields('inst')}
          <button type="submit" class="btn btn-brand">Submit <span class="spinner-border spinner-border-sm d-none"></span></button>
        </form>
      </div>
    </div>
  `
}

function submitForm(id) {
  const form = document.getElementById(id)
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  return form
}

describe('Academy registration orchestration', () => {
  const originalLocation = window.location

  beforeEach(() => {
    setupDOM()
    vi.clearAllMocks()
    // Default: no bootstrap present (jsdom) → manual tab fallback path.
    delete window.bootstrap
    // Reset URL to default (no query).
    window.history.replaceState({}, '', '/academy-registration.html')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete document.body.dataset.page
    vi.useRealTimers()
    // Restore window.location if a test replaced it.
    if (window.location !== originalLocation) {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        configurable: true,
        writable: true,
      })
    }
  })

  describe('individual: valid submit', () => {
    it('calls submitIndividualApplication with the correctly nested payload', async () => {
      validateIndividualApplication.mockReturnValue(new Map())
      submitIndividualApplication.mockResolvedValue({ ok: true, data: { id: 'x' }, error: null, errorType: null })

      initAcademyRegistration()
      submitForm('individualForm')

      await vi.waitFor(() => {
        expect(submitIndividualApplication).toHaveBeenCalledTimes(1)
      })

      expect(submitIndividualApplication).toHaveBeenCalledWith({
        fullName: 'Ada Obi',
        age: 15,
        email: 'ada@example.com',
        phone: '+2348030000000',
        location: 'LAGOS',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          lgaOrProvince: 'Ikeja',
          streetAddress: '1 Allen Ave',
        },
      })
    })

    it('shows the success panel, hides the form and tabs, and redirects after the delay', async () => {
      vi.useFakeTimers()
      validateIndividualApplication.mockReturnValue(new Map())
      submitIndividualApplication.mockResolvedValue({ ok: true, data: { id: 'x' }, error: null, errorType: null })

      // Stub navigation (restored in afterEach via originalLocation)
      const hrefSetter = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { search: '', assign: vi.fn() },
        configurable: true,
        writable: true,
      })
      Object.defineProperty(window.location, 'href', { set: hrefSetter, get: () => '', configurable: true })

      initAcademyRegistration()
      const form = submitForm('individualForm')

      // Flush the async submit handler (microtasks) without advancing timers.
      await vi.waitFor(async () => {
        expect(submitIndividualApplication).toHaveBeenCalled()
      })
      await Promise.resolve()

      const successAlert = document.getElementById('successAlert')
      expect(successAlert.classList.contains('d-none')).toBe(false)
      expect(successAlert.textContent).toContain('Ada Obi')
      expect(form.classList.contains('d-none')).toBe(true)
      expect(document.getElementById('applicantTabs').classList.contains('d-none')).toBe(true)

      // Redirect not fired before the delay.
      expect(hrefSetter).not.toHaveBeenCalled()
      vi.advanceTimersByTime(REDIRECT_DELAY_MS)
      expect(hrefSetter).toHaveBeenCalledWith('/academy.html')
    })
  })

  describe('individual: validation blocks submit', () => {
    it('does not call the API when validation returns errors', () => {
      const errors = new Map([['age', 'Age must be between 5 and 60']])
      validateIndividualApplication.mockReturnValue(errors)

      initAcademyRegistration()
      submitForm('individualForm')

      expect(submitIndividualApplication).not.toHaveBeenCalled()
      const ageInput = document.getElementById('ind-age')
      expect(ageInput.classList.contains('is-invalid')).toBe(true)
      expect(ageInput.parentElement.querySelector('.invalid-feedback').textContent).toBe('Age must be between 5 and 60')
    })
  })

  describe('individual: API errors', () => {
    it('shows a friendly message on 409 conflict', async () => {
      validateIndividualApplication.mockReturnValue(new Map())
      submitIndividualApplication.mockResolvedValue({
        ok: false,
        data: null,
        errorType: 'api',
        error: { status: 409, message: 'exists', errors: null },
      })

      initAcademyRegistration()
      submitForm('individualForm')

      await vi.waitFor(() => {
        const errorAlert = document.getElementById('errorAlert')
        expect(errorAlert.classList.contains('d-none')).toBe(false)
      })
      expect(document.getElementById('errorAlert').textContent).toContain('already exists')
    })

    it('maps 400 field errors onto inputs', async () => {
      validateIndividualApplication.mockReturnValue(new Map())
      submitIndividualApplication.mockResolvedValue({
        ok: false,
        data: null,
        errorType: 'api',
        error: {
          status: 400,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Email already used' }],
        },
      })

      initAcademyRegistration()
      submitForm('individualForm')

      await vi.waitFor(() => {
        expect(document.getElementById('ind-email').classList.contains('is-invalid')).toBe(true)
      })
      expect(document.getElementById('ind-email').parentElement.querySelector('.invalid-feedback').textContent).toBe('Email already used')
    })
  })

  describe('institution: valid submit', () => {
    it('calls submitInstitutionApplication with the correctly nested payload', async () => {
      validateInstitutionApplication.mockReturnValue(new Map())
      submitInstitutionApplication.mockResolvedValue({ ok: true, data: { id: 'y' }, error: null, errorType: null })

      initAcademyRegistration()
      submitForm('institutionForm')

      await vi.waitFor(() => {
        expect(submitInstitutionApplication).toHaveBeenCalledTimes(1)
      })

      expect(submitInstitutionApplication).toHaveBeenCalledWith({
        institutionType: 'UNIVERSITY',
        name: 'University of Lagos',
        contactEmail: 'sports@unilag.edu.ng',
        contactPhone: '+2348050000000',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          lgaOrProvince: 'Ikeja',
          streetAddress: '1 Allen Ave',
        },
      })
    })
  })

  describe('deep-link ?type=institution', () => {
    it('activates the institution tab via the manual fallback when bootstrap is absent', () => {
      window.history.replaceState({}, '', '/academy-registration.html?type=institution')
      validateIndividualApplication.mockReturnValue(new Map())
      validateInstitutionApplication.mockReturnValue(new Map())

      initAcademyRegistration()

      expect(document.getElementById('institution-tab').classList.contains('active')).toBe(true)
      expect(document.getElementById('institution-pane').classList.contains('active')).toBe(true)
      expect(document.getElementById('individual-tab').classList.contains('active')).toBe(false)
      expect(document.getElementById('individual-pane').classList.contains('active')).toBe(false)
    })

    it('uses the Bootstrap Tab API when available', () => {
      window.history.replaceState({}, '', '/academy-registration.html?type=institution')
      const show = vi.fn()
      const getOrCreateInstance = vi.fn(() => ({ show }))
      window.bootstrap = { Tab: Object.assign(function () {}, { getOrCreateInstance }) }

      initAcademyRegistration()

      expect(getOrCreateInstance).toHaveBeenCalledWith(document.getElementById('institution-tab'))
      expect(show).toHaveBeenCalledTimes(1)
    })
  })
})
