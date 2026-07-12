import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerUser } from '../js/api-client.js'

describe('api-client: registerUser', () => {
  const validPayload = {
    email: 'athlete@example.com',
    phoneNumber: '+2341234567890',
    password: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns ok with data on 201 success', async () => {
    const responseData = {
      id: 'uuid-123',
      email: 'athlete@example.com',
      role: 'ROLE_ATHLETE',
      status: 'PENDING_VERIFICATION',
    }

    fetch.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve(responseData),
    })

    const result = await registerUser('athlete', validPayload)

    expect(result).toEqual({
      ok: true,
      data: responseData,
      error: null,
      errorType: null,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8082/api/v1/auth/register/athlete',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      })
    )
  })

  it('returns api error with field errors on 400', async () => {
    const errorBody = {
      timestamp: '2024-01-01T00:00:00Z',
      status: 400,
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Email is already in use' },
        { field: 'password', message: 'Password too weak' },
      ],
    }

    fetch.mockResolvedValue({
      status: 400,
      json: () => Promise.resolve(errorBody),
    })

    const result = await registerUser('coach', validPayload)

    expect(result).toEqual({
      ok: false,
      data: null,
      error: errorBody,
      errorType: 'api',
    })
  })

  it('returns api error on 409 conflict', async () => {
    const errorBody = {
      timestamp: '2024-01-01T00:00:00Z',
      status: 409,
      message: 'User already exists',
      errors: null,
    }

    fetch.mockResolvedValue({
      status: 409,
      json: () => Promise.resolve(errorBody),
    })

    const result = await registerUser('athlete', validPayload)

    expect(result).toEqual({
      ok: false,
      data: null,
      error: errorBody,
      errorType: 'api',
    })
  })

  it('returns api error on 500 server error', async () => {
    const errorBody = {
      timestamp: '2024-01-01T00:00:00Z',
      status: 500,
      message: 'Internal server error',
      errors: null,
    }

    fetch.mockResolvedValue({
      status: 500,
      json: () => Promise.resolve(errorBody),
    })

    const result = await registerUser('athlete', validPayload)

    expect(result).toEqual({
      ok: false,
      data: null,
      error: errorBody,
      errorType: 'api',
    })
  })

  it('returns timeout error when request exceeds 30s', async () => {
    fetch.mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new DOMException('The operation was aborted.', 'AbortError')
          reject(err)
        })
      })
    })

    const resultPromise = registerUser('athlete', validPayload)

    // Advance time past the 30s timeout
    await vi.advanceTimersByTimeAsync(30000)

    const result = await resultPromise

    expect(result).toEqual({
      ok: false,
      data: null,
      error: null,
      errorType: 'timeout',
    })
  })

  it('returns network error when fetch throws TypeError', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await registerUser('athlete', validPayload)

    expect(result).toEqual({
      ok: false,
      data: null,
      error: null,
      errorType: 'network',
    })
  })
})
