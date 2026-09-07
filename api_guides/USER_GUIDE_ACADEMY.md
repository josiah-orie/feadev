# Academy API Guide

## Overview

The Academy module lets interested individuals and institutions apply to the EAIDS academy, and lets administrators review those applications, run age‑category training schedules, assign coaches and scouts, and enroll approved applicants.

Academy applicants are **not** platform users — they live entirely in the academy tables. Coaches and scouts assigned to schedules reference existing platform users through their profiles.

**Key capabilities:**
- Public onboarding for individual and institution applicants (no login required)
- Admin review of applications (approve, or reject with a reason)
- Create and manage age‑category training schedules
- Assign coaches and scouts to schedules
- Enroll approved applicants into schedules
- Automatic email notifications on approval, rejection, staff assignment, and enrollment

**Base URL:** `http://localhost:8080` — the examples below use a `BASE_URL` placeholder:

```bash
export BASE_URL="http://localhost:8080"
```

---

## Enum reference

| Enum | Allowed values |
|------|----------------|
| `ApplicationStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `Location` (individual) | `ABUJA`, `LAGOS` |
| `InstitutionType` | `PUBLIC_PRIMARY`, `PRIVATE_PRIMARY`, `PUBLIC_SECONDARY`, `PRIVATE_SECONDARY`, `UNIVERSITY`, `POLYTECHNIC`, `COLLEGE_OF_EDUCATION`, `OTHER` |
| `AgeCategory` | `UNDER_14`, `UNDER_16`, `UNDER_18`, `UNDER_21`, `OPEN` |
| `ScheduleTargetType` | `INDIVIDUAL`, `INSTITUTION`, `BOTH` |
| `ScheduleStatus` | `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED` |
| `StaffType` | `COACH`, `SCOUT` |
| `ApplicantType` | `INDIVIDUAL`, `INSTITUTION` |

## Notification behavior

| Action | Recipient | Email |
|--------|-----------|-------|
| Application approved | Applicant (individual email / institution contact email) | Approval notice |
| Application rejected | Applicant | Rejection notice, including the reason |
| Coach/scout assigned to a schedule | The assigned coach/scout | Assignment notice with the schedule title |
| Applicant enrolled into a schedule | Applicant | Enrollment notice with the schedule title and start date |

Emails are sent asynchronously after the database transaction commits, with automatic retries.

---

# Onboarding

Public endpoints. No authentication required. Each application is created in `PENDING` status.

## Submit an individual application

`POST /api/v1/academy/applications/individuals`

```bash
curl -X POST "$BASE_URL/api/v1/academy/applications/individuals" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ada Obi",
    "age": 15,
    "email": "ada.obi@example.com",
    "phone": "+2348030000000",
    "location": "LAGOS",
    "address": {
      "country": "Nigeria",
      "state": "Lagos",
      "lgaOrProvince": "Ikeja",
      "streetAddress": "1 Allen Avenue"
    }
  }'
```

**Response — `201 Created`:**
```json
{
  "id": "8d090b36-3e18-4adc-9d03-56396ad25303",
  "fullName": "Ada Obi",
  "age": 15,
  "email": "ada.obi@example.com",
  "phone": "+2348030000000",
  "location": "LAGOS",
  "address": {
    "country": "Nigeria",
    "state": "Lagos",
    "lgaOrProvince": "Ikeja",
    "streetAddress": "1 Allen Avenue"
  },
  "status": "PENDING",
  "reviewNotes": null,
  "reviewedBy": null,
  "reviewDate": null,
  "createdDate": "2026-08-29T10:15:00",
  "lastModifiedDate": "2026-08-29T10:15:00"
}
```

Notes:
- `age` must be between 5 and 60.
- A duplicate `email` returns `409 Conflict`.
- Missing/invalid fields return `400 Bad Request`.

## Submit an institution application

`POST /api/v1/academy/applications/institutions`

```bash
curl -X POST "$BASE_URL/api/v1/academy/applications/institutions" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionType": "UNIVERSITY",
    "name": "University of Lagos",
    "contactEmail": "sports@unilag.edu.ng",
    "contactPhone": "+2348050000000",
    "address": {
      "country": "Nigeria",
      "state": "Lagos",
      "lgaOrProvince": "Akoka",
      "streetAddress": "University Road"
    }
  }'
```

**Response — `201 Created`:**
```json
{
  "id": "ae2318db-2cf4-461b-ba8f-7d2cf2143739",
  "institutionType": "UNIVERSITY",
  "name": "University of Lagos",
  "contactEmail": "sports@unilag.edu.ng",
  "contactPhone": "+2348050000000",
  "address": {
    "country": "Nigeria",
    "state": "Lagos",
    "lgaOrProvince": "Akoka",
    "streetAddress": "University Road"
  },
  "status": "PENDING",
  "reviewNotes": null,
  "reviewedBy": null,
  "reviewDate": null,
  "createdDate": "2026-08-29T10:20:00",
  "lastModifiedDate": "2026-08-29T10:20:00"
}
```

Notes:
- A duplicate `contactEmail` returns `409 Conflict`.
- `institutionType` must be one of the `InstitutionType` values above.

---

# Admin

All admin endpoints require a Bearer JWT for a user with the `ADMIN` role.

## Authentication

```bash
curl -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@eaids.com",
    "password": "Password@123"
  }'
```

Capture the token and reuse it:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiJ9..."
```

Every admin call below includes:

```
-H "Authorization: Bearer $TOKEN"
```

---

## Applications

### List individual applications

`GET /api/v1/academy/admin/applications/individuals`

Query params: `status` (optional: `PENDING` / `APPROVED` / `REJECTED`), `page` (default `0`), `size` (default `20`, max `100`), `sortBy` (default `createdDate`), `sortDir` (default `desc`).

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/applications/individuals?status=PENDING&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### List institution applications

`GET /api/v1/academy/admin/applications/institutions`

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/applications/institutions?status=PENDING" \
  -H "Authorization: Bearer $TOKEN"
```

### Approve or reject an individual application

`POST /api/v1/academy/admin/applications/individuals/{applicationId}/review`

Only `PENDING` applications can be reviewed. `decision` must be `APPROVED` or `REJECTED`. A non‑blank `reviewNotes` is **required** when rejecting.

Approve:
```bash
curl -X POST "$BASE_URL/api/v1/academy/admin/applications/individuals/8d090b36-3e18-4adc-9d03-56396ad25303/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED"
  }'
```

Reject with a reason:
```bash
curl -X POST "$BASE_URL/api/v1/academy/admin/applications/individuals/8d090b36-3e18-4adc-9d03-56396ad25303/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "REJECTED",
    "reviewNotes": "Applicant is outside the current catchment area."
  }'
```

**Response — `200 OK`** returns the updated application with `status`, `reviewNotes`, `reviewedBy`, and `reviewDate` populated. The applicant receives an approval or rejection email.

### Approve or reject an institution application

`POST /api/v1/academy/admin/applications/institutions/{applicationId}/review`

```bash
curl -X POST "$BASE_URL/api/v1/academy/admin/applications/institutions/ae2318db-2cf4-461b-ba8f-7d2cf2143739/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "REJECTED",
    "reviewNotes": "Incomplete facility information provided."
  }'
```

---

## Training schedules

### Create a training schedule

`POST /api/v1/academy/admin/schedules`

Created in `DRAFT` status. `startDate`/`endDate` must be today or later, `endDate` must not be before `startDate`, and `capacity` must be at least 1.

```bash
curl -X POST "$BASE_URL/api/v1/academy/admin/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "U16 Lagos Skills Camp",
    "description": "Six-week fundamentals camp for the U16 category.",
    "ageCategory": "UNDER_16",
    "targetType": "INDIVIDUAL",
    "startDate": "2026-09-05",
    "endDate": "2026-10-17",
    "location": "Teslim Balogun Stadium, Lagos",
    "capacity": 40
  }'
```

**Response — `201 Created`:**
```json
{
  "id": "3406e6c7-dcde-4c29-a6af-e70e0e7894ab",
  "title": "U16 Lagos Skills Camp",
  "description": "Six-week fundamentals camp for the U16 category.",
  "ageCategory": "UNDER_16",
  "targetType": "INDIVIDUAL",
  "startDate": "2026-09-05",
  "endDate": "2026-10-17",
  "location": "Teslim Balogun Stadium, Lagos",
  "capacity": 40,
  "status": "DRAFT",
  "createdDate": "2026-08-29T11:00:00",
  "lastModifiedDate": "2026-08-29T11:00:00"
}
```

### Get a training schedule

`GET /api/v1/academy/admin/schedules/{scheduleId}`

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab" \
  -H "Authorization: Bearer $TOKEN"
```

### List training schedules

`GET /api/v1/academy/admin/schedules`

Query params: `ageCategory`, `targetType`, `status` (all optional filters), plus `page`, `size`, `sortBy` (default `startDate`), `sortDir` (default `asc`).

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/schedules?ageCategory=UNDER_16&targetType=INDIVIDUAL&status=DRAFT" \
  -H "Authorization: Bearer $TOKEN"
```

### Update a training schedule

`PUT /api/v1/academy/admin/schedules/{scheduleId}` — only `DRAFT` schedules can be updated. Body is the same shape as create.

```bash
curl -X PUT "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "U16 Lagos Skills Camp (Revised)",
    "description": "Eight-week fundamentals camp for the U16 category.",
    "ageCategory": "UNDER_16",
    "targetType": "BOTH",
    "startDate": "2026-09-05",
    "endDate": "2026-10-31",
    "location": "Teslim Balogun Stadium, Lagos",
    "capacity": 60
  }'
```

### Publish a training schedule

`PATCH /api/v1/academy/admin/schedules/{scheduleId}/publish` — transitions `DRAFT` → `PUBLISHED`.

```bash
curl -X PATCH "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/publish" \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel a training schedule

`PATCH /api/v1/academy/admin/schedules/{scheduleId}/cancel` — transitions to `CANCELLED` (not allowed once `CANCELLED` or `COMPLETED`).

```bash
curl -X PATCH "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Coach & scout assignment

Assignments reference an existing coach's `CoachProfile` id (`staffType = COACH`) or a scout's `ScoutProfile` id (`staffType = SCOUT`).

### Assign a coach or scout

`POST /api/v1/academy/admin/schedules/{scheduleId}/staff`

```bash
# Assign a coach
curl -X POST "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/staff" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffType": "COACH",
    "profileId": "89e05c74-78fe-4f29-8bf8-05214035cf0e"
  }'
```

```bash
# Assign a scout
curl -X POST "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/staff" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffType": "SCOUT",
    "profileId": "eb529196-6aab-461b-a79e-b68b03465d71"
  }'
```

**Response — `201 Created`:**
```json
{
  "id": "b1f0a2c3-1111-2222-3333-444455556666",
  "scheduleId": "3406e6c7-dcde-4c29-a6af-e70e0e7894ab",
  "staffType": "COACH",
  "profileId": "89e05c74-78fe-4f29-8bf8-05214035cf0e",
  "staffName": "Coach Bello",
  "staffEmail": "bello@eaids.com",
  "assignedDate": "2026-08-29T11:30:00"
}
```

The assigned coach/scout receives an assignment email. An unknown profile id returns `404 Not Found`; a duplicate assignment returns `409 Conflict`.

### List staff for a schedule

`GET /api/v1/academy/admin/schedules/{scheduleId}/staff`

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/staff" \
  -H "Authorization: Bearer $TOKEN"
```

### Remove a staff assignment

`DELETE /api/v1/academy/admin/schedules/{scheduleId}/staff/{staffAssignmentId}`

```bash
curl -X DELETE "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/staff/b1f0a2c3-1111-2222-3333-444455556666" \
  -H "Authorization: Bearer $TOKEN"
```

Returns `204 No Content`.

---

## Enrollment

Only `APPROVED` applicants can be enrolled. The applicant type must match the schedule's `targetType` (a `BOTH` schedule accepts either). Enrollment is rejected once the schedule reaches capacity, and duplicates are not allowed.

### Enroll an approved applicant

`POST /api/v1/academy/admin/schedules/{scheduleId}/enrollments`

```bash
# Enroll an approved individual
curl -X POST "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/enrollments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantType": "INDIVIDUAL",
    "applicationId": "8d090b36-3e18-4adc-9d03-56396ad25303"
  }'
```

```bash
# Enroll an approved institution
curl -X POST "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/enrollments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantType": "INSTITUTION",
    "applicationId": "ae2318db-2cf4-461b-ba8f-7d2cf2143739"
  }'
```

**Response — `201 Created`:**
```json
{
  "id": "c2d3e4f5-7777-8888-9999-000011112222",
  "scheduleId": "3406e6c7-dcde-4c29-a6af-e70e0e7894ab",
  "applicantType": "INDIVIDUAL",
  "applicationId": "8d090b36-3e18-4adc-9d03-56396ad25303",
  "applicantName": "Ada Obi",
  "applicantEmail": "ada.obi@example.com",
  "enrolledDate": "2026-08-29T12:00:00"
}
```

The applicant receives an enrollment email with the schedule title and start date.

Common error responses:
- `400 Bad Request` — applicant not `APPROVED`, applicant type does not match the schedule `targetType`, or schedule at full capacity.
- `404 Not Found` — schedule or application not found.
- `409 Conflict` — the applicant is already enrolled in the schedule.

### List enrollments for a schedule

`GET /api/v1/academy/admin/schedules/{scheduleId}/enrollments`

```bash
curl -X GET "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/enrollments" \
  -H "Authorization: Bearer $TOKEN"
```

### Remove an enrollment

`DELETE /api/v1/academy/admin/schedules/{scheduleId}/enrollments/{enrollmentId}`

```bash
curl -X DELETE "$BASE_URL/api/v1/academy/admin/schedules/3406e6c7-dcde-4c29-a6af-e70e0e7894ab/enrollments/c2d3e4f5-7777-8888-9999-000011112222" \
  -H "Authorization: Bearer $TOKEN"
```

Returns `204 No Content`.

---

## End-to-end flow

1. An individual or institution submits an application (Onboarding) → status `PENDING`.
2. An admin lists pending applications and approves or rejects each (with a reason for rejection). The applicant is emailed.
3. An admin creates a training schedule for an age category and target type, then publishes it.
4. An admin assigns coaches and scouts to the schedule. Each is emailed.
5. An admin enrolls approved applicants (matching the target type, within capacity). Each is emailed.
