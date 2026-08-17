# Events API Guide

## Overview

The Events module provides full CRUD operations for managing events (exhibition games, showcases, tournaments, community events, etc.) and allows any authenticated user to register their attendance.

**Key capabilities:**
- Create, read, update, and delete events (Admin only for write operations)
- Manage event lifecycle through status transitions
- Self-registration for any authenticated user (athlete, coach, scout)
- Full attendance tracking (REGISTERED → CONFIRMED → ATTENDED / NO_SHOW)

**Base URL:** `http://localhost:8080`

---

## Authentication

Most event endpoints require a valid JWT token. The **List All Events** endpoint (`GET /api/v1/events`) is publicly accessible without authentication.

To obtain a token, log in:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@eaids.com",
    "password": "Password@123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 86400,
  "userInfo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@eaids.com",
    "role": "ROLE_ADMIN",
    "status": "ACTIVE"
  }
}
```

Use the `accessToken` in subsequent requests:
```
Authorization: Bearer <accessToken>
```

**Seed accounts for testing:**

| Email | Password | Role |
|-------|----------|------|
| admin@eaids.com | Password@123 | ADMIN |
| athlete@eaids.com | Password@123 | ATHLETE |
| coach@eaids.com | Password@123 | COACH |
| scout@eaids.com | Password@123 | SCOUT |

---

## Event Status Lifecycle

```
DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → IN_PROGRESS → COMPLETED
  ↓            ↓                     ↓                  ↓
  └──────────── ─────────────────────────────────────────┘
                              CANCELLED
```

**Transition rules:**
- `DRAFT` → `REGISTRATION_OPEN` or `CANCELLED`
- `REGISTRATION_OPEN` → `REGISTRATION_CLOSED` or `CANCELLED`
- `REGISTRATION_CLOSED` → `IN_PROGRESS` or `CANCELLED`
- `IN_PROGRESS` → `COMPLETED` or `CANCELLED`
- `COMPLETED` → (terminal, no further transitions)
- `CANCELLED` → (terminal, no further transitions)

**Business rules:**
- Only events in `DRAFT` status can be updated or deleted
- Users can only register when event status is `REGISTRATION_OPEN`

---

## Registration Status Lifecycle

```
REGISTERED → CONFIRMED → ATTENDED
                       → NO_SHOW
REGISTERED → CANCELLED
CONFIRMED  → CANCELLED
```

**Transition rules:**
- Only `REGISTERED` or `CONFIRMED` registrations can be cancelled by the user
- Admin can update any non-cancelled registration to `CONFIRMED`, `ATTENDED`, or `NO_SHOW`

---

## Event CRUD Endpoints

### Create Event

Creates a new event in `DRAFT` status. **Admin only.**

```bash
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Lagos Exhibition Game 2026",
    "description": "Annual exhibition game showcasing top talent from across Nigeria.",
    "eventType": "Exhibition Game",
    "location": "Teslim Balogun Stadium",
    "country": "Nigeria",
    "state": "Lagos",
    "startDate": "2026-10-15",
    "endDate": "2026-10-15",
    "startTime": "10:00:00",
    "endTime": "16:00:00",
    "registrationDeadline": "2026-10-01",
    "capacity": 200,
    "eventImage": "https://images.eaids.com/events/lagos-exhibition-2026.jpg",
    "imagePath": "/events/lagos-exhibition-2026.jpg"
  }'
```

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Lagos Exhibition Game 2026",
  "description": "Annual exhibition game showcasing top talent from across Nigeria.",
  "eventType": "Exhibition Game",
  "status": "DRAFT",
  "location": "Teslim Balogun Stadium",
  "country": "Nigeria",
  "state": "Lagos",
  "startDate": "2026-10-15",
  "endDate": "2026-10-15",
  "startTime": "10:00:00",
  "endTime": "16:00:00",
  "registrationDeadline": "2026-10-01",
  "capacity": 200,
  "currentRegistrationCount": 0,
  "eventImage": "https://images.eaids.com/events/lagos-exhibition-2026.jpg",
  "imagePath": "/events/lagos-exhibition-2026.jpg",
  "createdDate": "2026-08-17T10:30:00.000000",
  "lastModifiedDate": "2026-08-17T10:30:00.000000",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "lastModifiedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation rules:**
| Field | Constraint |
|-------|-----------|
| name | Required, max 200 chars |
| eventType | Required, max 100 chars |
| location | Required, max 200 chars |
| country | Required, max 100 chars |
| state | Optional, max 100 chars |
| startDate | Required, must be present or future |
| endDate | Required, must be present or future |
| startTime | Optional |
| endTime | Optional |
| registrationDeadline | Optional |
| capacity | Required, min 1, max 100000 |
| description | Optional, max 5000 chars |
| eventImage | Optional, max 512 chars (URL to event image) |
| imagePath | Optional, max 512 chars (file path to event image) |

---

### Get Event by ID

Retrieves a single event. **Any authenticated user.**

```bash
curl -X GET http://localhost:8080/api/v1/events/{eventId} \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Lagos Exhibition Game 2026",
  "description": "Annual exhibition game showcasing top talent from across Nigeria.",
  "eventType": "Exhibition Game",
  "status": "REGISTRATION_OPEN",
  "location": "Teslim Balogun Stadium",
  "country": "Nigeria",
  "state": "Lagos",
  "startDate": "2026-10-15",
  "endDate": "2026-10-15",
  "startTime": "10:00:00",
  "endTime": "16:00:00",
  "registrationDeadline": "2026-10-01",
  "capacity": 200,
  "currentRegistrationCount": 45,
  "eventImage": "https://images.eaids.com/events/lagos-exhibition-2026.jpg",
  "imagePath": "/events/lagos-exhibition-2026.jpg",
  "createdDate": "2026-08-17T10:30:00.000000",
  "lastModifiedDate": "2026-08-17T12:00:00.000000",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "lastModifiedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### List All Events

Lists all events with pagination, sorting, and optional filtering. **Public endpoint — no authentication required.**

```bash
# Basic request (no auth needed)
curl -X GET "http://localhost:8080/api/v1/events"

# With pagination
curl -X GET "http://localhost:8080/api/v1/events?page=0&size=10"

# With sorting
curl -X GET "http://localhost:8080/api/v1/events?sortBy=startDate&sortDir=desc"

# Filter by status
curl -X GET "http://localhost:8080/api/v1/events?status=REGISTRATION_OPEN"

# Filter by event type
curl -X GET "http://localhost:8080/api/v1/events?eventType=Exhibition%20Game"

# Filter by country
curl -X GET "http://localhost:8080/api/v1/events?country=Nigeria"

# Search by name, location, or description
curl -X GET "http://localhost:8080/api/v1/events?search=Lagos"

# Filter by date range
curl -X GET "http://localhost:8080/api/v1/events?startDateFrom=2026-10-01&startDateTo=2026-12-31"

# Combine multiple filters
curl -X GET "http://localhost:8080/api/v1/events?status=REGISTRATION_OPEN&country=Nigeria&sortBy=startDate&sortDir=asc&page=0&size=10"
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | String | — | Filter by event status |
| eventType | String | — | Filter by event type (case-insensitive) |
| country | String | — | Filter by country (case-insensitive) |
| search | String | — | Search across name, location, and description |
| startDateFrom | Date (yyyy-MM-dd) | — | Events starting on or after this date |
| startDateTo | Date (yyyy-MM-dd) | — | Events starting on or before this date |
| page | int | 0 | Page number (zero-based) |
| size | int | 20 | Page size (max 100) |
| sortBy | String | startDate | Sort field (e.g. startDate, name, createdDate, country) |
| sortDir | String | asc | Sort direction: `asc` or `desc` |

**Available status filter values:** `DRAFT`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Lagos Exhibition Game 2026",
      "description": "Annual exhibition game showcasing top talent from across Nigeria.",
      "eventType": "Exhibition Game",
      "status": "REGISTRATION_OPEN",
      "location": "Teslim Balogun Stadium",
      "country": "Nigeria",
      "state": "Lagos",
      "startDate": "2026-10-15",
      "endDate": "2026-10-15",
      "startTime": "10:00:00",
      "endTime": "16:00:00",
      "registrationDeadline": "2026-10-01",
      "capacity": 200,
      "currentRegistrationCount": 45,
      "eventImage": "https://images.eaids.com/events/lagos-exhibition-2026.jpg",
      "imagePath": "/events/lagos-exhibition-2026.jpg",
      "createdDate": "2026-08-17T10:30:00.000000",
      "lastModifiedDate": "2026-08-17T12:00:00.000000",
      "createdBy": "550e8400-e29b-41d4-a716-446655440000",
      "lastModifiedBy": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "direction": "ASC",
      "property": "startDate"
    }
  },
  "totalElements": 3,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "first": true,
  "last": true,
  "numberOfElements": 3,
  "empty": false
}
```

---

### Update Event

Updates an event. Only events in `DRAFT` status can be updated. **Admin only.**

All fields are optional — only provided fields are updated.

```bash
curl -X PUT http://localhost:8080/api/v1/events/{eventId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Lagos Exhibition Game 2026 - Updated",
    "capacity": 250,
    "endTime": "17:00:00"
  }'
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Lagos Exhibition Game 2026 - Updated",
  "description": "Annual exhibition game showcasing top talent from across Nigeria.",
  "eventType": "Exhibition Game",
  "status": "DRAFT",
  "location": "Teslim Balogun Stadium",
  "country": "Nigeria",
  "state": "Lagos",
  "startDate": "2026-10-15",
  "endDate": "2026-10-15",
  "startTime": "10:00:00",
  "endTime": "17:00:00",
  "registrationDeadline": "2026-10-01",
  "capacity": 250,
  "currentRegistrationCount": 0,
  "createdDate": "2026-08-17T10:30:00.000000",
  "lastModifiedDate": "2026-08-17T14:00:00.000000",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "lastModifiedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Delete Event

Deletes an event. Only events in `DRAFT` status can be deleted. **Admin only.**

```bash
curl -X DELETE http://localhost:8080/api/v1/events/{eventId} \
  -H "Authorization: Bearer <token>"
```

**Response (204 No Content):** Empty body.

---

### Transition Event Status

Transitions an event to the next lifecycle status. **Admin only.**

```bash
curl -X PATCH http://localhost:8080/api/v1/events/{eventId}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "REGISTRATION_OPEN"
  }'
```

**Response (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Lagos Exhibition Game 2026",
  "description": "Annual exhibition game showcasing top talent from across Nigeria.",
  "eventType": "Exhibition Game",
  "status": "REGISTRATION_OPEN",
  "location": "Teslim Balogun Stadium",
  "country": "Nigeria",
  "state": "Lagos",
  "startDate": "2026-10-15",
  "endDate": "2026-10-15",
  "startTime": "10:00:00",
  "endTime": "16:00:00",
  "registrationDeadline": "2026-10-01",
  "capacity": 200,
  "currentRegistrationCount": 0,
  "createdDate": "2026-08-17T10:30:00.000000",
  "lastModifiedDate": "2026-08-17T15:00:00.000000",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "lastModifiedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Event Registration Endpoints

### Register for Event (Authenticated)

Self-registers the authenticated user for an event. Event must be in `REGISTRATION_OPEN` status. **Any authenticated user.**

```bash
curl -X POST http://localhost:8080/api/v1/events/{eventId}/register \
  -H "Authorization: Bearer <token>"
```

**Response (201 Created):**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "Lagos Exhibition Game 2026",
  "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "userEmail": "athlete@eaids.com",
  "guestName": null,
  "guestEmail": null,
  "guestPhone": null,
  "guest": false,
  "status": "REGISTERED",
  "createdDate": "2026-08-17T16:00:00.000000",
  "lastModifiedDate": "2026-08-17T16:00:00.000000"
}
```

---

### Register for Event (Guest — No Authentication Required)

Registers a non-authenticated guest for an event. Requires name and email. **Public endpoint — no token required.**

```bash
curl -X POST http://localhost:8080/api/v1/events/{eventId}/register/guest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Guest",
    "email": "john.guest@example.com",
    "phone": "+2348012345678"
  }'
```

**Response (201 Created):**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "Lagos Exhibition Game 2026",
  "userId": null,
  "userEmail": null,
  "guestName": "John Guest",
  "guestEmail": "john.guest@example.com",
  "guestPhone": "+2348012345678",
  "guest": true,
  "status": "REGISTERED",
  "createdDate": "2026-08-17T16:00:00.000000",
  "lastModifiedDate": "2026-08-17T16:00:00.000000"
}
```

**Validation rules:**
| Field | Constraint |
|-------|-----------|
| name | Required, max 100 chars |
| email | Required, valid email format, max 255 chars |
| phone | Optional, max 20 chars |

---

### Cancel Registration (Authenticated)

### Cancel Registration (Authenticated)

Cancels the authenticated user's registration. Only `REGISTERED` or `CONFIRMED` registrations can be cancelled. **Any authenticated user (own registration).**

```bash
curl -X POST http://localhost:8080/api/v1/events/{eventId}/registrations/{registrationId}/cancel \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "Lagos Exhibition Game 2026",
  "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "userEmail": "athlete@eaids.com",
  "guestName": null,
  "guestEmail": null,
  "guestPhone": null,
  "guest": false,
  "status": "CANCELLED",
  "createdDate": "2026-08-17T16:00:00.000000",
  "lastModifiedDate": "2026-08-17T17:00:00.000000"
}
```

---

### Cancel Guest Registration (No Authentication Required)

Cancels a guest registration by email. **Public endpoint — no token required.**

```bash
curl -X POST http://localhost:8080/api/v1/events/{eventId}/register/guest/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.guest@example.com"
  }'
```

**Response (200 OK):**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "Lagos Exhibition Game 2026",
  "userId": null,
  "userEmail": null,
  "guestName": "John Guest",
  "guestEmail": "john.guest@example.com",
  "guestPhone": "+2348012345678",
  "guest": true,
  "status": "CANCELLED",
  "createdDate": "2026-08-17T16:00:00.000000",
  "lastModifiedDate": "2026-08-17T17:00:00.000000"
}
```

---

### List Event Registrations

Lists all registrations for a specific event. **Admin and Coach only.**

```bash
curl -X GET http://localhost:8080/api/v1/events/{eventId}/registrations \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "eventName": "Lagos Exhibition Game 2026",
    "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userEmail": "athlete@eaids.com",
    "status": "REGISTERED",
    "createdDate": "2026-08-17T16:00:00.000000",
    "lastModifiedDate": "2026-08-17T16:00:00.000000"
  },
  {
    "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "eventName": "Lagos Exhibition Game 2026",
    "userId": "e5f6a7b8-c9d0-1234-ef01-345678901234",
    "userEmail": "coach@eaids.com",
    "status": "CONFIRMED",
    "createdDate": "2026-08-17T16:30:00.000000",
    "lastModifiedDate": "2026-08-17T18:00:00.000000"
  }
]
```

---

### Update Registration Status

Updates the attendance status of a registration. **Admin only.**

```bash
curl -X PATCH http://localhost:8080/api/v1/events/{eventId}/registrations/{registrationId}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "ATTENDED"
  }'
```

**Response (200 OK):**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventName": "Lagos Exhibition Game 2026",
  "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "userEmail": "athlete@eaids.com",
  "status": "ATTENDED",
  "createdDate": "2026-08-17T16:00:00.000000",
  "lastModifiedDate": "2026-08-18T09:00:00.000000"
}
```

**Valid status values:** `CONFIRMED`, `ATTENDED`, `NO_SHOW`, `CANCELLED`

---

### Get My Registrations

Lists all event registrations for the authenticated user across all events. **Any authenticated user.**

```bash
curl -X GET http://localhost:8080/api/v1/events/my-registrations \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "eventName": "Lagos Exhibition Game 2026",
    "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userEmail": "athlete@eaids.com",
    "status": "REGISTERED",
    "createdDate": "2026-08-17T16:00:00.000000",
    "lastModifiedDate": "2026-08-17T16:00:00.000000"
  },
  {
    "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
    "eventId": "11223344-5566-7788-99aa-bbccddeeff00",
    "eventName": "Port Harcourt Community Day",
    "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "userEmail": "athlete@eaids.com",
    "status": "ATTENDED",
    "createdDate": "2026-06-15T10:00:00.000000",
    "lastModifiedDate": "2026-06-20T15:00:00.000000"
  }
]
```

---

## Error Responses

### 400 Bad Request — Validation Error

Returned when request body fails validation.

```bash
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "",
    "capacity": -1
  }'
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "name": "Event name is required",
    "eventType": "Event type is required",
    "location": "Location is required",
    "country": "Country is required",
    "startDate": "Start date is required",
    "endDate": "End date is required",
    "capacity": "Capacity must be at least 1"
  }
}
```

---

### 401 Unauthorized

Returned when no token is provided or token is invalid/expired for endpoints that require authentication.

```bash
curl -X GET http://localhost:8080/api/v1/events/some-event-id
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "path": "/api/v1/events/some-event-id",
  "status": 401,
  "message": "Unauthorized: Authentication is required to access this resource"
}
```

> **Note:** `GET /api/v1/events` (list all events) does not require authentication and will not return a 401.

---

### 403 Forbidden

Returned when authenticated user lacks the required role.

```bash
# Athlete trying to create an event (admin only)
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <athlete_token>" \
  -d '{ "name": "My Event", ... }'
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 403,
  "message": "Forbidden: You do not have permission to access this resource"
}
```

---

### 404 Not Found

Returned when the specified event or registration does not exist.

```bash
curl -X GET http://localhost:8080/api/v1/events/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 404,
  "message": "Event not found with id: 00000000-0000-0000-0000-000000000000"
}
```

---

### 409 Conflict — Duplicate Registration

Returned when a user attempts to register for an event they're already registered for.

```bash
# User already registered for this event
curl -X POST http://localhost:8080/api/v1/events/{eventId}/register \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 409,
  "message": "User is already registered for this event"
}
```

---

### 400 Bad Request — Invalid State Transition

Returned when an operation violates business rules.

```bash
# Trying to update an event that's not in DRAFT status
curl -X PUT http://localhost:8080/api/v1/events/{eventId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "name": "Updated Name" }'
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 400,
  "message": "Event can only be updated in DRAFT status"
}
```

```bash
# Trying an invalid status transition
curl -X PATCH http://localhost:8080/api/v1/events/{eventId}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "status": "COMPLETED" }'
```

**Response:**
```json
{
  "timestamp": "2026-08-17T10:30:00.000000",
  "status": 400,
  "message": "Cannot transition event from DRAFT to COMPLETED. Allowed transitions: [REGISTRATION_OPEN, CANCELLED]"
}
```

---

## Full Workflow Example

Here's a complete end-to-end workflow demonstrating event creation through attendance tracking:

```bash
# 1. Admin logs in
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@eaids.com","password":"Password@123"}' \
  | jq -r '.accessToken')

# 2. Admin creates an event
EVENT_ID=$(curl -s -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Kaduna Showcase 2026",
    "description": "Regional talent showcase",
    "eventType": "Showcase",
    "location": "Ahmadu Bello Stadium",
    "country": "Nigeria",
    "state": "Kaduna",
    "startDate": "2026-11-01",
    "endDate": "2026-11-02",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "registrationDeadline": "2026-10-25",
    "capacity": 100
  }' | jq -r '.id')

# 3. Admin opens registration
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "REGISTRATION_OPEN"}'

# 4. Athlete logs in and registers
ATHLETE_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"athlete@eaids.com","password":"Password@123"}' \
  | jq -r '.accessToken')

REG_ID=$(curl -s -X POST http://localhost:8080/api/v1/events/$EVENT_ID/register \
  -H "Authorization: Bearer $ATHLETE_TOKEN" | jq -r '.id')

# 5. Admin closes registration
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "REGISTRATION_CLOSED"}'

# 6. Admin confirms attendance
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/registrations/$REG_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "CONFIRMED"}'

# 7. Admin starts event
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "IN_PROGRESS"}'

# 8. After event, admin marks attendance
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/registrations/$REG_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "ATTENDED"}'

# 9. Admin completes the event
curl -X PATCH http://localhost:8080/api/v1/events/$EVENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "COMPLETED"}'

# 10. Athlete views their registrations
curl -X GET http://localhost:8080/api/v1/events/my-registrations \
  -H "Authorization: Bearer $ATHLETE_TOKEN"
```

---

## Endpoint Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/v1/events | ADMIN | Create a new event |
| GET | /api/v1/events | Public | List all events (paginated, with filtering and sorting) |
| GET | /api/v1/events/{eventId} | Authenticated | Get event details |
| PUT | /api/v1/events/{eventId} | ADMIN | Update event (DRAFT only) |
| DELETE | /api/v1/events/{eventId} | ADMIN | Delete event (DRAFT only) |
| PATCH | /api/v1/events/{eventId}/status | ADMIN | Transition event status |
| POST | /api/v1/events/{eventId}/register | Authenticated | Register for an event (authenticated user) |
| POST | /api/v1/events/{eventId}/register/guest | Public | Register for an event (guest, no auth) |
| POST | /api/v1/events/{eventId}/registrations/{id}/cancel | Authenticated | Cancel own registration |
| POST | /api/v1/events/{eventId}/register/guest/cancel | Public | Cancel guest registration by email |
| GET | /api/v1/events/{eventId}/registrations | ADMIN, COACH | List event registrations |
| PATCH | /api/v1/events/{eventId}/registrations/{id}/status | ADMIN | Update registration status |
| GET | /api/v1/events/my-registrations | Authenticated | List own registrations |
