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
