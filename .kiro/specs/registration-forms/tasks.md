# Implementation Plan: Registration Forms

## Overview

This plan implements athlete and coach registration pages for the AFEDEV website. The work covers creating two HTML pages, three new JavaScript modules (form-validator, api-client, registration), modifying existing modules (main.js, site-chrome.js), adding minimal CSS, updating Vite config, and setting up Vitest + fast-check for property-based and unit testing.

## Tasks

- [x] 1. Set up testing infrastructure and project configuration
  - [x] 1.1 Install Vitest, fast-check, and jsdom as dev dependencies
    - Run `npm install -D vitest fast-check @vitest/coverage-v8 jsdom`
    - Add a `"test"` script to `package.json`: `"test": "vitest --run"`
    - Update `vite.config.ts` to add `test: { environment: 'jsdom' }` configuration
    - Register `register-athlete.html` and `register-coach.html` in `vite.config.ts` under `rollupOptions.input`
    - _Requirements: 1.6, 2.6_

  - [x] 1.2 Create the `js/form-validator.js` module with validation functions
    - Export `validateEmail(email)` returning `{ valid, message }`
    - Export `validatePassword(password)` enforcing Password_Rules (8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char)
    - Export `validatePasswordMatch(password, confirmPassword)` returning `{ valid, message }`
    - Export `validateRegistrationForm(fields)` returning a `Map<string, string>` of field name → error message
    - All functions must be pure with no side effects
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 1.3 Create the `js/api-client.js` module with HTTP communication logic
    - Export `registerUser(role, payload)` that POSTs to `http://localhost:8082/api/v1/auth/register/{role}`
    - Set `Content-Type: application/json` header
    - Use AbortController with a 30-second timeout
    - Return `{ ok, data, error, errorType }` where errorType is `'timeout'`, `'network'`, or `'api'`
    - Parse JSON responses for both success (201) and error cases
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.5_

- [x] 2. Implement registration orchestration and navigation
  - [x] 2.1 Create the `js/registration.js` module
    - Export `initRegistration()` that reads role from `document.body.dataset.page`
    - Attach submit handler: prevent default, run `validateRegistrationForm()`, display validation errors or call `registerUser()`
    - Manage loading state: disable submit button, show spinner
    - On success: hide form, show success alert with `aria-live="polite"`
    - On API error: map field errors to form fields via `.invalid-feedback`, show general errors in alert container
    - On network/timeout error: show "Unable to connect to the server. Please try again later."
    - On 409: show "This email or phone number is already registered"
    - On 500 or unexpected status: show "Something went wrong. Please try again later."
    - Clear all previous errors on resubmission
    - _Requirements: 4.5, 4.6, 5.4, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 2.2 Modify `js/site-chrome.js` to add Register dropdown navigation
    - Add a "Register" dropdown to `NAV_ITEMS` with entries for "Athlete Registration" (`/register-athlete.html`) and "Coach Registration" (`/register-coach.html`)
    - Update `renderNav()` to handle dropdown items using Bootstrap dropdown markup
    - _Requirements: 1.8, 2.8, 9.1_

  - [x] 2.3 Modify `js/main.js` to initialize registration on registration pages
    - Import `initRegistration` from `./registration.js`
    - Call `initRegistration()` when `data-page` is `register-athlete` or `register-coach`
    - _Requirements: 1.4, 2.4_

- [x] 3. Checkpoint - Verify JS modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create HTML pages and CSS
  - [x] 4.1 Create `register-athlete.html`
    - Include `data-page="register-athlete"` on `<body>`
    - Include skip-to-content link targeting `<main id="main">`
    - Include `<div id="site-header"></div>` and `<div id="site-footer"></div>` placeholders
    - Include breadcrumb nav: Home > Athlete Registration (with `aria-label="Breadcrumb"`)
    - Include page-hero section with title "Athlete Registration"
    - Include registration form in a `.form-card` container with fields: email (type email, name email, maxlength 254, autocomplete email), phone (type tel, name phoneNumber, autocomplete tel), password (type password, name password, minlength 8, maxlength 128, autocomplete new-password), confirm password (type password, name confirmPassword, minlength 8, maxlength 128, autocomplete new-password)
    - All fields required with associated labels (matching `for`/`id`)
    - Submit button with text "Register" and class `btn-brand`
    - Success alert container (hidden, `aria-live="polite"`)
    - General error alert container (hidden, `aria-live="polite"`)
    - Link to coach registration page: "Register as a Coach instead"
    - Load Bootstrap 5.3.3 CDN, Manrope font CDN, `css/styles.css`, and `js/main.js` as module
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 4.2 Create `register-coach.html`
    - Same structure as `register-athlete.html` but with `data-page="register-coach"`
    - Page-hero title: "Coach Registration"
    - Breadcrumb: Home > Coach Registration
    - Link to athlete registration page: "Register as an Athlete instead"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 4.3 Add CSS additions to `css/styles.css`
    - Add `.registration-form` with max-width constraint for large viewports
    - Add `.btn-brand .spinner-border` sizing rule for the loading spinner inside the submit button
    - _Requirements: 10.4_

- [x] 5. Property-based and unit tests
  - [x] 5.1 Write property test for required field validation completeness
    - **Property 1: Required field validation completeness**
    - Generate random subsets of fields set to empty/whitespace and verify `validateRegistrationForm()` returns errors for exactly those fields
    - **Validates: Requirements 4.1**

  - [x] 5.2 Write property test for email validation correctness
    - **Property 2: Email validation correctness**
    - Generate random valid and invalid email strings and verify `validateEmail()` returns correct `valid` boolean
    - **Validates: Requirements 4.2**

  - [x] 5.3 Write property test for password rule enforcement
    - **Property 3: Password rule enforcement**
    - Generate random strings violating/satisfying each Password_Rule and verify `validatePassword()` returns correct result
    - **Validates: Requirements 4.3**

  - [x] 5.4 Write property test for password match validation
    - **Property 4: Password match validation**
    - Generate random string pairs (matching and non-matching) and verify `validatePasswordMatch()` returns correct result
    - **Validates: Requirements 4.4**

  - [x] 5.5 Write property test for API payload fidelity
    - **Property 5: API payload fidelity**
    - Generate random valid payloads and roles, mock fetch, and verify the request body and URL match inputs exactly
    - **Validates: Requirements 5.3, 6.3**

  - [x] 5.6 Write property test for error response field mapping
    - **Property 6: Error response field mapping**
    - Generate random error arrays with mixed matching/non-matching field names and verify correct routing to field-level or general alert
    - **Validates: Requirements 8.1**

  - [x] 5.7 Write unit tests for form-validator edge cases
    - Test boundary values: exactly 8 chars, exactly 128 chars, 7 chars, 129 chars, empty string, whitespace-only
    - Test email edge cases: missing @, missing domain, >254 chars
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.8 Write unit tests for api-client (success and error handling)
    - Mock fetch for 201 success response parsing
    - Mock fetch for 400, 409, 500 responses
    - Test timeout behavior with AbortController
    - Test network error handling
    - _Requirements: 5.1, 5.5, 6.1, 6.5, 7.1, 8.3, 8.4, 8.7_

  - [x] 5.9 Write unit tests for registration orchestration
    - Test form submit flow with valid inputs
    - Test loading state (button disabled, spinner shown)
    - Test success display (form hidden, alert shown)
    - Test error display (field errors mapped, general alert shown)
    - Test resubmission clears previous errors
    - _Requirements: 4.5, 4.6, 5.4, 7.1, 7.2, 8.5, 8.6_

  - [x] 5.10 Write unit test for navigation dropdown rendering
    - Verify Register dropdown renders with both athlete and coach links
    - _Requirements: 9.1_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All JavaScript uses vanilla ES modules (no frameworks)
- Bootstrap 5.3.3 is loaded via CDN, not bundled

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "4.3"] },
    { "id": 3, "tasks": ["2.3", "4.1", "4.2"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.7"] },
    { "id": 5, "tasks": ["5.5", "5.8", "5.10"] },
    { "id": 6, "tasks": ["5.6", "5.9"] }
  ]
}
```
