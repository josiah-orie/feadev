# Bugfix Requirements Document

## Introduction

The "Register to Attend" link on the Wheelchair American Football Exhibition Game event card in `events.html` contains a hardcoded `eventId=placeholder-uuid` in its query string. When a user clicks through to the registration page and submits the form, the API client sends this literal string as a path parameter to `POST /api/v1/events/{eventId}/register/guest`. The Spring Boot backend expects a valid `java.util.UUID`, causing a `MethodArgumentTypeMismatchException` and returning a 500 Internal Server Error. Users see a generic failure message with no actionable guidance.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "Register to Attend" on the Wheelchair Exhibition Game event card THEN the system navigates to the registration page with `eventId=placeholder-uuid` in the URL query string

1.2 WHEN the event registration form is submitted with `eventId=placeholder-uuid` THEN the system sends a POST request to `/api/v1/events/placeholder-uuid/register/guest` causing the backend to return a 500 Internal Server Error (MethodArgumentTypeMismatchException)

1.3 WHEN the backend returns a 500 error due to invalid UUID format THEN the system displays a generic "Something went wrong. Please try again later." message without indicating that the event link is invalid

### Expected Behavior (Correct)

2.1 WHEN a user clicks "Register to Attend" on the Wheelchair Exhibition Game event card THEN the system SHALL navigate to the registration page with a valid UUID as the `eventId` query parameter (once the real event is created in the backend), OR display clear guidance that registration is not yet available if no real event ID exists

2.2 WHEN the event registration form is submitted with an eventId that is not a valid UUID format THEN the system SHALL block the API request and display an error message such as "This event link is invalid. Please return to the events page and try again." without making a network request

2.3 WHEN the event registration page loads with an eventId that is not a valid UUID format THEN the system SHALL hide the registration form and display an error indicating the event link is invalid

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the event registration page loads with a valid UUID eventId THEN the system SHALL CONTINUE TO display the registration form and allow submission

3.2 WHEN the event registration form is submitted with valid data and a valid UUID eventId THEN the system SHALL CONTINUE TO send the POST request to the backend and display success or error responses as before

3.3 WHEN the event registration page loads with no eventId parameter at all THEN the system SHALL CONTINUE TO display the existing "No event specified" error and hide the form

3.4 WHEN other event cards (e.g., Combine, Coaching Workshops) link to contact or other pages THEN the system SHALL CONTINUE TO navigate to those pages without any UUID validation
