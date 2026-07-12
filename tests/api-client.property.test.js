import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { registerUser } from '../js/api-client.js'

// Feature: registration-forms, Property 5: API payload fidelity

describe('Property 5: API payload fidelity', () => {
  /** Validates: Requirements 5.3, 6.3 */

  let originalFetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 'uuid-123', email: 'test@example.com', role: 'ROLE_ATHLETE', status: 'PENDING_VERIFICATION' }),
      })
    )
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('should send payload with exact fields and values to the correct URL for any role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('athlete', 'coach'),
        fc.record({
          email: fc.string({ minLength: 1, maxLength: 50 }),
          phoneNumber: fc.string({ minLength: 1, maxLength: 20 }),
          password: fc.string({ minLength: 1, maxLength: 50 }),
          confirmPassword: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (role, payload) => {
          // Reset mock call history
          globalThis.fetch.mockClear()

          await registerUser(role, payload)

          // Verify fetch was called exactly once
          expect(globalThis.fetch).toHaveBeenCalledTimes(1)

          const [url, options] = globalThis.fetch.mock.calls[0]

          // Verify URL ends with /auth/register/{role}
          expect(url).toMatch(new RegExp(`/auth/register/${role}$`))

          // Verify Content-Type header
          expect(options.headers['Content-Type']).toBe('application/json')

          // Verify the request body contains exactly the 4 fields with matching values
          const body = JSON.parse(options.body)
          expect(body).toEqual({
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            password: payload.password,
            confirmPassword: payload.confirmPassword,
          })

          // Verify no extra fields in the body
          expect(Object.keys(body)).toHaveLength(4)
          expect(Object.keys(body).sort()).toEqual(['confirmPassword', 'email', 'password', 'phoneNumber'])
        }
      ),
      { numRuns: 100 }
    )
  })
})
