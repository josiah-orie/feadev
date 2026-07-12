# EAIDS IAM API — User Guide

Base URL: `http://localhost:8080/api/v1`

---

## Authentication Flow Overview

```
┌──────────┐     ┌──────────────┐     ┌─────────┐     ┌──────────────────┐
│ Register │────▶│ Verify Email │────▶│  Login  │────▶│ Access Resources │
└──────────┘     └──────────────┘     └─────────┘     └──────────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │Refresh Token │ (when access token expires)
                                   └──────────────┘
```

1. **Register** — Create an account (athlete or coach)
2. **Verify Email** — Confirm your email using the token sent to your inbox
3. **Complete Profile** (athletes) — Submit personal/physical/sports info
4. **Admin Approval** — Wait for admin to activate your account
5. **Login** — Get an access token + refresh token
6. **Access Resources** — Use the access token in the `Authorization: Bearer <token>` header
7. **Refresh** — Exchange a refresh token for a new token pair when the access token expires (1 hour)

---

## Registration Workflows

### Athlete (4-step)

| Step | Endpoint | What happens |
|------|----------|--------------|
| 1. Register | `POST /auth/register/athlete` | Account created, verification email sent |
| 2. Verify Email | `POST /auth/verify-email` | Email confirmed, profile completion unlocked |
| 3. Complete Profile | `POST /athletes/profile/complete` | Profile saved; status → UNDER_REVIEW (adults) or PENDING_CONSENT (minors) |
| 3b. Guardian Consent (minors only) | `POST /athletes/guardian-consent` | Consent recorded, status → UNDER_REVIEW |
| 4. Admin Approval | (admin action) | Status → ACTIVE, login enabled |

### Coach (3-step)

| Step | Endpoint | What happens |
|------|----------|--------------|
| 1. Register | `POST /auth/register/coach` | Account + profile created, verification email sent |
| 2. Verify Email | `POST /auth/verify-email` | Email confirmed, status → UNDER_REVIEW |
| 3. Admin Verification | (admin action) | Status → ACTIVE, login enabled |

---

## Error Handling

Every error response follows this structure:

```json
{
  "timestamp": "2025-07-14T09:22:18.042Z",
  "status": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email format is invalid" },
    { "field": "password", "message": "Password must contain at least 8 characters" }
  ]
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error or bad request |
| 401 | Missing/invalid/expired token |
| 403 | Insufficient permissions or account not active |
| 404 | Resource not found |
| 405 | HTTP method not allowed |
| 409 | Duplicate resource (email/phone already registered) |
| 429 | Too many attempts (OTP exhausted) |
| 500 | Server error (no details exposed) |

When there are no field-level errors, `errors` will be `null`:

```json
{
  "timestamp": "2025-07-14T09:22:18.042Z",
  "status": 404,
  "message": "User not found with id: 550e8400-e29b-41d4-a716-446655440000",
  "errors": null
}
```

---

## Example cURL Commands

### Register Athlete

```bash
curl -X POST http://localhost:8080/api/v1/auth/register/athlete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chidi.okafor@gmail.com",
    "phoneNumber": "+2348023456789",
    "password": "Str0ng@Pass1",
    "confirmPassword": "Str0ng@Pass1"
  }'
```

**Response (201 Created):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "chidi.okafor@gmail.com",
  "role": "ROLE_ATHLETE",
  "status": "PENDING_VERIFICATION"
}
```

---

### Register Coach

Coach registration creates both the account and the profile in a single step.

```bash
curl -X POST http://localhost:8080/api/v1/auth/register/coach \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amara.eze@gmail.com",
    "phoneNumber": "+2349012345678",
    "password": "Str0ng@Pass1",
    "confirmPassword": "Str0ng@Pass1",
    "fullName": "Amara Eze",
    "dateOfBirth": "1988-06-22",
    "gender": "FEMALE",
    "nationality": "Nigerian",
    "stateOfResidence": "Abuja",
    "currentSport": "Football",
    "currentOrganization": "Lagos Football Academy",
    "currentPosition": "Head Coach",
    "yearsOfExperience": 10,
    "areaOfInterest": "COACH",
    "availability": "FULL_TIME",
    "americanFootballExperience": "FLAG_FOOTBALL",
    "involvementLevel": "NATIONAL",
    "coachingInterests": ["YOUTH_DEVELOPMENT", "TACKLE_FOOTBALL", "ATHLETE_DEVELOPMENT"]
  }'
```

**Required fields:** `email`, `phoneNumber`, `password`, `confirmPassword`, `fullName`, `dateOfBirth`, `gender`, `areaOfInterest`, `availability`, `americanFootballExperience`, `involvementLevel`, `coachingInterests`

**Optional fields:** `nationality`, `stateOfResidence`, `profilePhoneNumber`, `emailAddress`, `currentSport`, `currentOrganization`, `currentPosition`, `yearsOfExperience`

**Enum values:**

| Field | Allowed values |
|-------|---------------|
| `gender` | `MALE`, `FEMALE`, `OTHER` |
| `areaOfInterest` | `COACH`, `REFEREE`, `MEDICAL`, `PHYSIO`, `MEDIA` |
| `availability` | `PART_TIME`, `FULL_TIME` |
| `americanFootballExperience` | `FLAG_FOOTBALL`, `TACKLE_FOOTBALL`, `NO_EXPERIENCE` |
| `involvementLevel` | `LOCAL`, `REGIONAL`, `NATIONAL`, `INTERNATIONAL` |
| `coachingInterests` | `YOUTH_DEVELOPMENT`, `FLAG_FOOTBALL`, `TACKLE_FOOTBALL`, `STRENGTH_AND_CONDITIONING`, `OFFENSIVE_COACHING`, `DEFENSIVE_COACHING`, `SPECIAL_TEAMS`, `ATHLETE_DEVELOPMENT`, `SCOUTING` |

**Response (201 Created):**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "email": "amara.eze@gmail.com",
  "role": "ROLE_COACH",
  "status": "PENDING_VERIFICATION"
}
```

After registration, the coach must verify their email (see below). Once verified, the account moves to `UNDER_REVIEW` and awaits admin approval before login is enabled.

---

### Verify Email

```bash
curl -X POST http://localhost:8080/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "d4e5f6a7-b8c9-0123-def4-567890abcdef"
  }'
```

**Response (200 OK):**

```json
{
  "message": "Email verified successfully"
}
```

---

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "chidi.okafor@gmail.com",
    "password": "Str0ng@Pass1"
  }'
```

You can also login with a phone number:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+2348023456789",
    "password": "Str0ng@Pass1"
  }'
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImNoaWRpLm9rYWZvckBnbWFpbC5jb20iLCJyb2xlIjoiUk9MRV9BVEhMRVRFIiwic3RhdHVzIjoiQUNUSVZFIiwiaWF0IjoxNzIwOTQ4NTM4LCJleHAiOjE3MjA5NTIxMzh9.signature",
  "refreshToken": "f7e8d9c0-b1a2-3456-7890-abcdef012345",
  "expiresIn": 3600,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "chidi.okafor@gmail.com",
    "role": "ROLE_ATHLETE",
    "status": "ACTIVE"
  }
}
```

---

### Complete Profile (Athlete)

Requires authentication. Send the access token as a Bearer token.

```bash
curl -X POST http://localhost:8080/api/v1/athletes/profile/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "fullName": "Chidi Okafor",
    "dateOfBirth": "2000-03-15",
    "gender": "MALE",
    "stateOfResidence": "Lagos",
    "countryOfResidence": "Nigeria",
    "nationality": "Nigerian",
    "heightCm": 185.5,
    "weightKg": 88.0,
    "sportsBackgrounds": ["ATHLETICS", "BASKETBALL"],
    "athleteInterest": "TACKLE_FOOTBALL",
    "videos": [
      {
        "url": "https://www.youtube.com/watch?v=abc123def",
        "videoType": "YOUTUBE"
      }
    ]
  }'
```

**Response (200 OK):** Full athlete profile object.

---

### Refresh Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "f7e8d9c0-b1a2-3456-7890-abcdef012345"
  }'
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...<new_token>",
  "refreshToken": "a9b8c7d6-e5f4-3210-fedc-ba0987654321",
  "expiresIn": 3600,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "chidi.okafor@gmail.com",
    "role": "ROLE_ATHLETE",
    "status": "ACTIVE"
  }
}
```

Note: The old refresh token is revoked after use. Always store the new one.

---

### Forgot Password

```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chidi.okafor@gmail.com"
  }'
```

**Response (200 OK):**

```json
{
  "message": "If an account exists with that email, a password reset code has been sent"
}
```

A 6-digit OTP is sent to the email. It expires in 5 minutes.

---

### Verify OTP

```bash
curl -X POST http://localhost:8080/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chidi.okafor@gmail.com",
    "otp": "482937"
  }'
```

**Response (200 OK):**

```json
{
  "message": "OTP verified successfully",
  "data": {
    "resetToken": "c3d4e5f6-a7b8-9012-cdef-345678901234"
  }
}
```

The reset token is valid for 15 minutes. Max 5 failed OTP attempts before the code is invalidated.

---

### Reset Password

```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "newPassword": "N3wSecure@Pass"
  }'
```

**Response (200 OK):**

```json
{
  "message": "Password reset successfully"
}
```

All existing refresh tokens are revoked — you'll need to login again.

---

## Using the Access Token

Include the token in every request to protected endpoints:

```bash
curl -X GET http://localhost:8080/api/v1/athletes/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

The access token expires after **1 hour** (3600 seconds). Use the refresh token endpoint to get a new one without re-entering credentials.

---

## Password Rules

Passwords must satisfy all of:
- 8–128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*()-_=+` etc.)

---

## Interactive API Docs

Swagger UI is available at:

```
http://localhost:8080/swagger-ui.html
```

No authentication required to browse the docs. You can test endpoints directly from the Swagger interface by clicking "Authorize" and entering your Bearer token.
