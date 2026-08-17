# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Invalid UUID Reaches API
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: `eventId=placeholder-uuid`, `eventId=abc123`, `eventId=not-a-uuid`
  - Test that `initEventRegistration()` with invalid UUID eventId hides the form and shows an error (from Bug Condition in design: `isBugCondition(input)` where eventId is non-null, non-empty, and does NOT match UUID regex)
  - The test assertions should match the Expected Behavior: form hidden, error displayed, no network request made
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: form is shown and API call proceeds with invalid UUID)
  - Document counterexamples found: form displayed for `placeholder-uuid`, submission triggers 500 error
  - Mark task complete when test is written, run, and failure is documented
  - **NOTE**: No test framework is configured in this project. Perform manual verification by navigating to `event-registration.html?eventId=placeholder-uuid` and observing that the form is shown (confirming the bug). Document findings.
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid UUID and Missing EventId Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Navigate to `event-registration.html?eventId=550e8400-e29b-41d4-a716-446655440000` on unfixed code — form is displayed
  - Observe: Navigate to `event-registration.html` (no eventId) on unfixed code — "No event specified" error shown, form hidden
  - Observe: Navigate to `event-registration.html?eventId=` (empty) on unfixed code — existing error path triggered
  - Write observations capturing behavior: valid UUID shows form; missing/empty eventId shows error (from Preservation Requirements in design)
  - Verify observations match on UNFIXED code
  - **EXPECTED OUTCOME**: Observed behaviors confirm baseline to preserve
  - **NOTE**: No test framework is configured in this project. Perform manual verification by navigating with valid UUID and missing eventId params. Document observed behavior as baseline.
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix for invalid UUID eventId reaching API and causing 500 error

  - [x] 3.1 Add `isValidUUID()` utility function to `js/event-registration.js`
    - Add a module-level exported function: `export function isValidUUID(str)`
    - Uses regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
    - Returns `true` for valid UUID format, `false` otherwise
    - Place before `initEventRegistration()` function definition
    - _Bug_Condition: isBugCondition(input) where input.eventId is non-null, non-empty, and NOT matching UUID regex_
    - _Expected_Behavior: Block invalid UUIDs before any API interaction_
    - _Preservation: Function is additive; does not modify any existing code paths_
    - _Requirements: 2.2, 2.3_

  - [x] 3.2 Add UUID format validation gate in `initEventRegistration()` after existing `!eventId` check
    - After the existing `if (!eventId)` early return, add: `if (!isValidUUID(eventId)) { ... }`
    - Inside the guard: hide the registration form (`form.classList.add('d-none')`)
    - Hide the event details panel
    - Show error using existing `showGeneralError(errorAlert, ...)` pattern with message: "This event link is invalid. Please return to the events page and try again."
    - Set `pageLead` text to indicate the link is broken
    - Return early (do not proceed to API call or form setup)
    - _Bug_Condition: isBugCondition(input) where eventId present but invalid format_
    - _Expected_Behavior: form hidden, error displayed, no network request_
    - _Preservation: Valid UUIDs pass through unchanged; missing eventId still handled by existing check_
    - _Requirements: 2.2, 2.3, 3.1, 3.3_

  - [x] 3.3 Replace placeholder-uuid link in `events.html` with disabled button
    - Find the `<a>` tag with `href` containing `eventId=placeholder-uuid` on the Wheelchair Exhibition Game card
    - Replace with: `<button class="btn btn-brand disabled" disabled aria-disabled="true">Registration Opening Soon</button>`
    - Add HTML comment above: `<!-- TODO: Replace with real eventId UUID from backend once the Wheelchair Exhibition Game event is created (expected September 2026) -->`
    - This prevents users from reaching the registration page with an invalid ID entirely
    - _Bug_Condition: Eliminates the source of placeholder-uuid navigation_
    - _Expected_Behavior: Users see "Registration Opening Soon" instead of a broken link_
    - _Preservation: All other event card links (Combine, Coaching Workshops, Training Program) remain unchanged_
    - _Requirements: 2.1, 3.4_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Invalid UUID Blocks Registration
    - **IMPORTANT**: Re-run the SAME verification from task 1 - do NOT write a new test
    - Navigate to `event-registration.html?eventId=placeholder-uuid` after fix
    - Verify: form is hidden, error message "This event link is invalid" is displayed, no API call made
    - Navigate to `event-registration.html?eventId=abc123` — same behavior
    - **EXPECTED OUTCOME**: Verification PASSES (confirms bug is fixed)
    - _Requirements: 2.2, 2.3_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid UUID and Missing EventId Behavior
    - **IMPORTANT**: Re-run the SAME verifications from task 2 - do NOT write new tests
    - Navigate to `event-registration.html?eventId=550e8400-e29b-41d4-a716-446655440000` — form is displayed (same as before)
    - Navigate to `event-registration.html` (no eventId) — "No event specified" error shown (same as before)
    - Navigate to `events.html` — other event card links still work correctly
    - **EXPECTED OUTCOME**: All verifications PASS (confirms no regressions)
    - Confirm all behavior unchanged after fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Ensure all verifications pass
  - Verify the disabled button renders correctly on `events.html`
  - Verify invalid UUID shows error on registration page
  - Verify valid UUID still shows form on registration page
  - Verify missing eventId still shows existing error
  - Ensure all verifications pass, ask the user if questions arise.
