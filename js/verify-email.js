/**
 * Verify Email page logic.
 * Handles token submission, email verification, and resend with cooldown.
 */

import { verifyEmail, resendVerification } from './api-client.js'

const COOLDOWN_MS = 20 * 60 * 1000 // 20 minutes
const STORAGE_KEY = 'afedev_resend_cooldown_start'

/**
 * Masks an email address for display (e.g. "t***@example.com").
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || ''
  const [local, domain] = email.split('@')
  if (local.length <= 1) return `${local}***@${domain}`
  return `${local[0]}***@${domain}`
}

/**
 * Initializes all verify-email page behavior.
 */
export function initVerifyEmail() {
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email') || ''

  const emailInfo = document.getElementById('emailInfo')
  const form = document.getElementById('verifyForm')
  const tokenInput = document.getElementById('token')
  const submitBtn = form?.querySelector('button[type="submit"]')
  const spinner = submitBtn?.querySelector('.spinner-border')
  const successAlert = document.getElementById('successAlert')
  const errorAlert = document.getElementById('errorAlert')
  const resendBtn = document.getElementById('resendBtn')
  const resendStatus = document.getElementById('resendStatus')

  // Display masked email
  if (emailInfo && email) {
    emailInfo.textContent = `We sent a verification code to ${maskEmail(email)}`
  }

  // Token submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      hideAlerts()

      const token = tokenInput?.value?.trim() || ''
      if (!token) {
        tokenInput?.classList.add('is-invalid')
        return
      }
      tokenInput?.classList.remove('is-invalid')

      // Loading state
      setLoading(true)

      const result = await verifyEmail(token)

      if (result.ok) {
        showSuccess('Email verified successfully! Redirecting...')
        if (form) form.classList.add('d-none')
        if (resendBtn) resendBtn.classList.add('d-none')
        if (resendStatus) resendStatus.textContent = ''
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        setLoading(false)
        const message = getErrorMessage(result)
        showError(message)
      }
    })
  }

  // Resend logic
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (!email) {
        showError('No email address available. Please register again.')
        return
      }

      hideAlerts()
      resendBtn.disabled = true

      const result = await resendVerification(email)

      if (result.ok) {
        showResendStatus('Verification code resent successfully.')
        startCooldown()
      } else {
        resendBtn.disabled = false
        const message = getErrorMessage(result)
        showError(message)
      }
    })
  }

  // Restore cooldown if still active
  restoreCooldown()

  // --- Helper functions ---

  function setLoading(loading) {
    if (submitBtn) submitBtn.disabled = loading
    if (spinner) {
      spinner.classList.toggle('d-none', !loading)
    }
  }

  function hideAlerts() {
    if (successAlert) {
      successAlert.textContent = ''
      successAlert.classList.add('d-none')
    }
    if (errorAlert) {
      errorAlert.textContent = ''
      errorAlert.classList.add('d-none')
    }
  }

  function showSuccess(message) {
    if (successAlert) {
      successAlert.textContent = message
      successAlert.classList.remove('d-none')
    }
  }

  function showError(message) {
    if (errorAlert) {
      errorAlert.textContent = message
      errorAlert.classList.remove('d-none')
    }
  }

  function showResendStatus(message) {
    if (resendStatus) resendStatus.textContent = message
  }

  function startCooldown() {
    const startTime = Date.now()
    sessionStorage.setItem(STORAGE_KEY, String(startTime))
    runCooldownTimer(startTime)
  }

  function restoreCooldown() {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const startTime = parseInt(stored, 10)
    const elapsed = Date.now() - startTime

    if (elapsed < COOLDOWN_MS) {
      runCooldownTimer(startTime)
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  function runCooldownTimer(startTime) {
    if (resendBtn) resendBtn.disabled = true

    const tick = () => {
      const elapsed = Date.now() - startTime
      const remaining = COOLDOWN_MS - elapsed

      if (remaining <= 0) {
        if (resendBtn) resendBtn.disabled = false
        showResendStatus('')
        sessionStorage.removeItem(STORAGE_KEY)
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      showResendStatus(`Resend available in ${display}`)

      setTimeout(tick, 1000)
    }

    tick()
  }
}

/**
 * Extracts a user-friendly error message from an API result.
 * @param {import('./api-client.js').ApiResponse} result
 * @returns {string}
 */
function getErrorMessage(result) {
  if (result.errorType === 'timeout') {
    return 'Request timed out. Please try again.'
  }
  if (result.errorType === 'network') {
    return 'Unable to connect to the server. Please check your connection and try again.'
  }
  if (result.errorType === 'api' && result.error) {
    return result.error.message || 'Verification failed. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
