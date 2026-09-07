/**
 * @typedef {Object} ApiSuccess
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {string} status
 */

/**
 * @typedef {Object} ApiFieldError
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} ApiError
 * @property {string} timestamp
 * @property {number} status
 * @property {string} message
 * @property {ApiFieldError[]|null} errors
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} ok
 * @property {ApiSuccess|null} data
 * @property {ApiError|null} error
 * @property {'timeout'|'network'|'api'|null} errorType
 */

const API_BASE = 'https://api.feadev.com/api/v1'
 // const API_BASE = 'http://localhost:8082/api/v1'
const TIMEOUT_MS = 30000

/**
 * Derives the server origin from the API base URL.
 */
const API_ORIGIN = new URL(API_BASE).origin

/**
 * Builds a full image URL from a relative imagePath returned by the API.
 * @param {string} imagePath - Relative path, e.g. "/events/lagos-exhibition-2026.jpg"
 * @returns {string} Full URL to the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return ''
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // Ensure leading slash
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_ORIGIN}${path}`
}

/**
 * Registers a user (athlete or coach).
 * @param {'athlete'|'coach'} role
 * @param {{ email: string, phoneNumber: string, password: string, confirmPassword: string }} payload
 * @returns {Promise<ApiResponse>}
 */
/**
 * Verifies a user's email using the token they received.
 * @param {string} token
 * @returns {Promise<ApiResponse>}
 */
export async function verifyEmail(token) {
  const url = `${API_BASE}/auth/verify-email`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 200) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}

/**
 * Requests a new verification code to be sent to the user's email.
 * @param {string} email
 * @returns {Promise<ApiResponse>}
 */
export async function resendVerification(email) {
  const url = `${API_BASE}/auth/resend-verification`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 200) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}

export async function registerUser(role, payload) {
  const url = `${API_BASE}/auth/register/${role}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 201) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}

/**
 * Registers a guest (non-authenticated user) for an event.
 * @param {string} eventId - The UUID of the event to register for
 * @param {{ name: string, email: string, phone?: string }} payload
 * @returns {Promise<ApiResponse>}
 */
export async function registerGuest(eventId, { name, email, phone }) {
  const url = `${API_BASE}/events/${eventId}/register/guest`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const body = { name, email }
  if (phone && phone.trim()) {
    body.phone = phone.trim()
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 201) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}


/**
 * @typedef {Object} AcademyAddress
 * @property {string} country
 * @property {string} state
 * @property {string} lgaOrProvince
 * @property {string} streetAddress
 */

/**
 * @typedef {Object} IndividualApplicationPayload
 * @property {string} fullName
 * @property {number} age
 * @property {string} email
 * @property {string} phone
 * @property {'ABUJA'|'LAGOS'} location
 * @property {AcademyAddress} address
 */

/**
 * @typedef {Object} InstitutionApplicationPayload
 * @property {'PUBLIC_PRIMARY'|'PRIVATE_PRIMARY'|'PUBLIC_SECONDARY'|'PRIVATE_SECONDARY'|'UNIVERSITY'|'POLYTECHNIC'|'COLLEGE_OF_EDUCATION'|'OTHER'} institutionType
 * @property {string} name
 * @property {string} contactEmail
 * @property {string} contactPhone
 * @property {AcademyAddress} address
 */

/**
 * Submits a public individual application to the academy. No auth required.
 * @param {IndividualApplicationPayload} payload
 * @returns {Promise<ApiResponse>}
 */
export async function submitIndividualApplication(payload) {
  const url = `${API_BASE}/academy/applications/individuals`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 201) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}

/**
 * Submits a public institution application to the academy. No auth required.
 * @param {InstitutionApplicationPayload} payload
 * @returns {Promise<ApiResponse>}
 */
export async function submitInstitutionApplication(payload) {
  const url = `${API_BASE}/academy/applications/institutions`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 201) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json()
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}

/**
 * Fetches all events from the API. Public endpoint — no auth required.
 * @param {Object} [params] - Optional query parameters
 * @param {string} [params.status] - Filter by event status
 * @param {string} [params.eventType] - Filter by event type
 * @param {string} [params.sortBy] - Sort field (default: startDate)
 * @param {string} [params.sortDir] - Sort direction: asc or desc
 * @param {number} [params.page] - Page number (zero-based)
 * @param {number} [params.size] - Page size (max 100)
 * @returns {Promise<ApiResponse>}
 */
export async function fetchEvents(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }
  const queryStr = query.toString()
  const url = `${API_BASE}/events${queryStr ? '?' + queryStr : ''}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return { ok: true, data, error: null, errorType: null }
    }

    const errorBody = await response.json().catch(() => null)
    return { ok: false, data: null, error: errorBody, errorType: 'api' }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: null, errorType: 'timeout' }
    }

    return { ok: false, data: null, error: null, errorType: 'network' }
  }
}
