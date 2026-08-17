# Placeholder UUID Event Registration Bugfix Design

## Overview

The Wheelchair American Football Exhibition Game event card in `events.html` links to the registration page with `eventId=placeholder-uuid`. This literal string reaches the backend as a path parameter where Spring Boot expects a valid `java.util.UUID`, causing a 500 Internal Server Error. The fix adds client-side UUID format validation in `event-registration.js` (blocking invalid IDs before any API call) and replaces the broken link in `events.html` with a disabled "Coming Soon" state until a real event UUID is available from the backend.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — an `eventId` query parameter that is present but does not conform to UUID v4 format (e.g., `placeholder-uuid`)
- **Property (P)**: The desired behavior when an invalid UUID is detected — block the API request, hide the form, and show a clear "invalid event link" error message
- **Preservation**: Existing behavior for valid UUIDs (form shown, API called), missing eventId (existing error shown), and all other event cards (unchanged navigation)
- **initEventRegistration()**: The function in `js/event-registration.js` that reads query params, populates event details, and attaches the form submit handler
- **registerGuest()**: The function in `js/api-client.js` that sends `POST /api/v1/events/{eventId}/register/guest`
- **isValidUUID()**: A new reusable utility function that validates UUID format via regex

## Bug Details

### Bug Condition

The bug manifests when a user clicks "Register to Attend" on the Wheelchair Exhibition Game event card, which navigates to `event-registration.html?eventId=placeholder-uuid&...`. The `initEventRegistration()` function accepts this string without format validation, and on form submission `registerGuest()` builds a URL with it, causing the backend to reject it with a 500 error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { eventId: string | null }
  OUTPUT: boolean

  UUID_REGEX := /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  RETURN input.eventId IS NOT NULL
         AND input.eventId IS NOT EMPTY
         AND NOT UUID_REGEX.test(input.eventId)
END FUNCTION
```

### Examples

- `eventId=placeholder-uuid` → Invalid UUID format. Current: form shown, submit triggers 500 error. Expected: form hidden, error message displayed immediately on page load.
- `eventId=abc123` → Invalid UUID format. Current: form shown, submit triggers 500. Expected: form hidden, error message displayed.
- `eventId=550e8400-e29b-41d4-a716-446655440000` → Valid UUID format. Current: form shown, submit works (or returns event-level error). Expected: same behavior, unchanged.
- `eventId=` (empty string) → Treated as falsy by existing `if (!eventId)` check. Current: shows "No event specified" error. Expected: same behavior, unchanged.
- No `eventId` param at all → Current: shows "No event specified" error. Expected: same behavior, unchanged.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When `eventId` is a valid UUID, the registration form is displayed and submission calls the API as before
- When `eventId` is missing or empty, the existing "No event specified" error is shown and the form is hidden
- Mouse clicks and navigation on all other event cards (Combine, Coaching Workshops, Training Program) continue to work as before
- The form validation logic (name, email, phone) remains unchanged
- API error handling (409 conflict, 404 not found, network errors) remains unchanged
- Other pages that link to `register-athlete.html` or `contact.html` are unaffected

**Scope:**
All inputs where `eventId` is either null/empty (handled by existing code) or a valid UUID format should be completely unaffected by this fix. This includes:
- Valid UUID event IDs that may return 404 from the backend (event not yet created)
- Missing eventId parameter (existing error path)
- All non-registration page navigation
- All form field validation and submission logic after UUID gate passes

## Hypothesized Root Cause

Based on the bug description, the issues are:

1. **Missing Client-Side UUID Validation**: `initEventRegistration()` checks for the *presence* of `eventId` (`if (!eventId)`) but never validates its *format*. Any non-empty string passes through to the API call.

2. **Hardcoded Placeholder in HTML**: The `events.html` file contains a literal `eventId=placeholder-uuid` in the href because the real event hasn't been created in the backend yet (scheduled for September 2026). This was left as a development placeholder that should never have been a clickable registration link.

3. **No Defensive Layer Before API Call**: The `registerGuest()` function in `api-client.js` does not validate the eventId format before constructing the URL. While adding validation there is possible, the primary gate should be in `event-registration.js` at page load time to prevent the form from even being shown.

## Correctness Properties

Property 1: Bug Condition - Invalid UUID Blocks Registration

_For any_ page load where `eventId` is present, non-empty, and does NOT match UUID format (isBugCondition returns true), the fixed `initEventRegistration()` function SHALL hide the registration form, hide the event details panel, and display an error message indicating the event link is invalid, without making any network request.

**Validates: Requirements 2.2, 2.3**

Property 2: Preservation - Valid UUID Registration Flow

_For any_ page load where `eventId` is present and matches valid UUID format (isBugCondition returns false), the fixed `initEventRegistration()` function SHALL produce the same behavior as the original function, preserving form display, submission handling, and all API interactions.

**Validates: Requirements 3.1, 3.2**

Property 3: Preservation - Missing EventId Behavior

_For any_ page load where `eventId` is null or empty, the fixed `initEventRegistration()` function SHALL produce the same behavior as the original function, preserving the "No event specified" error display.

**Validates: Requirements 3.3**

## Fix Implementation

### Changes Required

**File**: `js/event-registration.js`

**Function**: `initEventRegistration()`

**Specific Changes**:

1. **Add `isValidUUID()` utility function**: Add a module-level function that tests a string against UUID v4 regex pattern (`/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`). This function is exported for reuse by other modules if needed.

2. **Add UUID format validation gate after existing `!eventId` check**: After the existing early return for missing eventId, add a new check: if `eventId` is present but `!isValidUUID(eventId)`, show an error message ("This event link is invalid. Please return to the events page and try again."), hide the form, hide event details, and return early.

3. **Error message for invalid UUID**: Use the existing `showGeneralError(errorAlert, ...)` pattern and the existing `errorAlert` element. Set `pageLead` text to indicate the link is broken.

4. **No changes to `registerGuest()` or form submission logic**: The UUID gate at page load prevents invalid IDs from ever reaching the API call path.

---

**File**: `events.html`

**Specific Changes**:

5. **Replace the placeholder registration link**: Change the `<a class="btn btn-brand" href="/event-registration.html?eventId=placeholder-uuid&...">Register to Attend</a>` to a disabled button indicating registration is not yet available:
   ```html
   <!-- TODO: Replace with real eventId UUID from backend once the Wheelchair Exhibition Game event is created (expected September 2026) -->
   <button class="btn btn-brand disabled" disabled aria-disabled="true">Registration Opening Soon</button>
   ```
   This prevents users from reaching the registration page with an invalid ID entirely.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that call `initEventRegistration()` with various invalid UUID values in the URL query string and observe whether the form is shown and whether an API call would be attempted. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Placeholder UUID Test**: Navigate to registration page with `eventId=placeholder-uuid` and submit form (will trigger 500 on unfixed code)
2. **Random String Test**: Navigate with `eventId=not-a-uuid-at-all` and submit form (will trigger 500 on unfixed code)
3. **Partial UUID Test**: Navigate with `eventId=550e8400-e29b-41d4` (truncated UUID) and submit form (will trigger 500 on unfixed code)
4. **UUID-Like But Invalid Test**: Navigate with `eventId=gggggggg-gggg-gggg-gggg-gggggggggggg` (wrong hex chars) and submit form (will trigger 500 on unfixed code)

**Expected Counterexamples**:
- Form is displayed and submission proceeds despite invalid eventId format
- API returns 500 error, user sees generic "Something went wrong" message
- Root cause confirmed: no UUID format validation exists in `initEventRegistration()`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := initEventRegistration_fixed(input)
  ASSERT form.classList.contains('d-none')
  ASSERT errorAlert.classList.does_not_contain('d-none')
  ASSERT errorAlert.textContent CONTAINS 'invalid'
  ASSERT no_network_request_made()
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT initEventRegistration_original(input) = initEventRegistration_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many valid UUID strings and verifies the form is always shown
- It generates edge cases (empty strings, null) and verifies existing error paths
- It provides strong guarantees that no regression is introduced for valid inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid UUIDs and missing eventId cases, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid UUID Preservation**: Generate random valid UUIDs, verify form is displayed and submission handler is attached
2. **Missing EventId Preservation**: Load page with no eventId param, verify "No event specified" error appears (same as before)
3. **Empty EventId Preservation**: Load page with `eventId=`, verify existing error path is triggered (same as before)
4. **Form Validation Preservation**: With valid UUID, submit form with invalid field data, verify field-level errors still appear

### Unit Tests

- Test `isValidUUID()` with valid UUIDs (various versions), invalid strings, empty strings, and edge cases
- Test `initEventRegistration()` early return for invalid UUID format (form hidden, error shown)
- Test `initEventRegistration()` continues to work for valid UUID format (form shown)
- Test that the existing `!eventId` check still works (no regression)

### Property-Based Tests

- Generate random strings and verify: if `isValidUUID(s)` is false and `s` is non-empty, the form is hidden and error is shown
- Generate random valid UUIDs and verify: form is displayed and submit handler is attached
- Generate random valid UUIDs with valid form data and verify: `registerGuest()` is called with the UUID

### Integration Tests

- Full flow: click disabled "Registration Opening Soon" button on events.html — verify no navigation occurs
- Full flow: manually navigate to `event-registration.html?eventId=placeholder-uuid` — verify form is hidden and error is shown
- Full flow: navigate to `event-registration.html?eventId=<valid-uuid>` — verify form is shown and submission works end-to-end
- Full flow: navigate to `event-registration.html` (no params) — verify existing error message appears
