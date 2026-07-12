# Requirements Document

## Introduction

This document specifies the requirements for adding athlete and coach registration pages to the AFEDEV website. The registration forms integrate with the EAIDS IAM backend API (`http://localhost:8082/api/v1`) to allow athletes and coaches to create accounts. The pages follow the existing multipage static site architecture using Bootstrap 5, custom dark theme CSS, and vanilla JavaScript ES modules.

## Glossary

- **Registration_Page**: An HTML page at `register-athlete.html` or `register-coach.html` containing a registration form
- **Registration_Form**: A Bootstrap-styled HTML form collecting user credentials for account creation
- **API_Client**: The vanilla JavaScript module responsible for making HTTP requests to the backend API
- **Athlete_Endpoint**: The backend API endpoint at `POST /auth/register/athlete`
- **Coach_Endpoint**: The backend API endpoint at `POST /auth/register/coach`
- **Success_Response**: An HTTP 201 response containing `id`, `email`, `role`, and `status` fields
- **Error_Response**: An HTTP error response containing `timestamp`, `status`, `message`, and `errors` fields
- **Password_Rules**: Password validation constraints requiring 8–128 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character
- **Site_Chrome**: The shared navigation and footer injected by `js/site-chrome.js`
- **Form_Validator**: The client-side validation logic that checks field constraints before submission

## Requirements

### Requirement 1: Athlete Registration Page Structure

**User Story:** As a prospective athlete, I want a dedicated registration page, so that I can create an athlete account on the AFEDEV platform.

#### Acceptance Criteria

1. THE Registration_Page SHALL be accessible at `register-athlete.html` in the project root
2. THE Registration_Page SHALL include a `data-page="register-athlete"` attribute on the `<body>` element
3. THE Registration_Page SHALL include a `page-hero` header section with the title "Athlete Registration" and a description of no more than 2 sentences summarizing the purpose of the registration page
4. THE Registration_Page SHALL load the Site_Chrome via `js/main.js` as a module script
5. THE Registration_Page SHALL include Bootstrap 5.3.3 (CDN), Manrope font (Google Fonts CDN), and `css/styles.css`
6. THE Registration_Page SHALL be registered in `vite.config.ts` under `rollupOptions.input`
7. THE Registration_Page SHALL include `<div id="site-header"></div>` and `<div id="site-footer"></div>` placeholder elements for Site_Chrome injection
8. THE Registration_Page SHALL be added as a navigation entry in the `NAV_ITEMS` array in `js/site-chrome.js`

### Requirement 2: Coach Registration Page Structure

**User Story:** As a prospective coach, I want a dedicated registration page, so that I can create a coach account on the AFEDEV platform.

#### Acceptance Criteria

1. THE Registration_Page SHALL be accessible at `register-coach.html` in the project root
2. THE Registration_Page SHALL include a `data-page="register-coach"` attribute on the `<body>` element
3. THE Registration_Page SHALL include a `page-hero` header section with the title "Coach Registration" and a description of no more than 2 sentences summarizing the purpose of the registration page
4. THE Registration_Page SHALL load the Site_Chrome via `js/main.js` as a module script
5. THE Registration_Page SHALL include Bootstrap 5.3.3 (CDN), Manrope font (Google Fonts CDN), and `css/styles.css`
6. THE Registration_Page SHALL be registered in `vite.config.ts` under `rollupOptions.input`
7. THE Registration_Page SHALL include `<div id="site-header"></div>` and `<div id="site-footer"></div>` placeholder elements for Site_Chrome injection
8. THE Registration_Page SHALL be added as a navigation entry in the `NAV_ITEMS` array in `js/site-chrome.js`

### Requirement 3: Registration Form Fields

**User Story:** As a user, I want clearly labelled form fields, so that I know what information to provide when registering.

#### Acceptance Criteria

1. THE Registration_Form SHALL contain an email input field of type `email` with the label "Email", the name attribute `email`, and a maximum length of 254 characters
2. THE Registration_Form SHALL contain a phone number input field of type `tel` with the label "Phone Number", the name attribute `phoneNumber`, and a placeholder indicating the expected format (e.g. "+234...")
3. THE Registration_Form SHALL contain a password input field of type `password` with the label "Password", the name attribute `password`, a minimum length of 8 characters, and a maximum length of 128 characters
4. THE Registration_Form SHALL contain a confirm password input field of type `password` with the label "Confirm Password", the name attribute `confirmPassword`, a minimum length of 8 characters, and a maximum length of 128 characters
5. THE Registration_Form SHALL mark all four fields as required using the HTML `required` attribute
6. THE Registration_Form SHALL display the fields in the following order from top to bottom: Email, Phone Number, Password, Confirm Password
7. THE Registration_Form SHALL associate each label with its corresponding input using a matching `for` attribute and `id` attribute pair
8. THE Registration_Form SHALL display a submit button with the text "Register" styled with the `btn-brand` class, positioned below all input fields

### Requirement 4: Client-Side Form Validation

**User Story:** As a user, I want immediate feedback on input errors, so that I can correct mistakes before submitting the form.

#### Acceptance Criteria

1. WHEN the user submits the Registration_Form with empty required fields, THE Form_Validator SHALL prevent submission and display a Bootstrap `.invalid-feedback` message below each empty required field indicating the field is required
2. WHEN the user submits the Registration_Form with an invalid email format, THE Form_Validator SHALL display a validation message "Please enter a valid email address" below the email field
3. WHEN the user submits the Registration_Form with a password that does not meet the Password_Rules, THE Form_Validator SHALL display a validation message below the password field stating the requirements: 8–128 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character
4. WHEN the user submits the Registration_Form and the password and confirm password fields do not match, THE Form_Validator SHALL display a validation message "Passwords do not match" below the confirm password field
5. WHEN the user submits the Registration_Form, THE Form_Validator SHALL add the Bootstrap `was-validated` class to the form element to activate validation state styling on all fields
6. WHEN a field that previously showed a validation error receives valid input and the form is resubmitted, THE Form_Validator SHALL remove the error indication for that field and show the valid state

### Requirement 5: API Integration for Athlete Registration

**User Story:** As a prospective athlete, I want my registration submitted to the backend, so that my account is created in the system.

#### Acceptance Criteria

1. WHEN the Registration_Form on the athlete page passes client-side validation, THE API_Client SHALL send a POST request to `http://localhost:8082/api/v1/auth/register/athlete` within 1 second of the user clicking the submit button
2. THE API_Client SHALL send the request body as JSON with `Content-Type: application/json` header
3. THE API_Client SHALL include the fields `email`, `phoneNumber`, `password`, and `confirmPassword` in the request payload, matching the values entered by the user without modification
4. WHILE the API request is in progress, THE Registration_Form SHALL disable the submit button and display a visible spinner or animation adjacent to or replacing the submit button text
5. IF the API request does not complete within 30 seconds, THEN THE API_Client SHALL abort the request, re-enable the submit button, hide the loading indicator, and display a timeout error message

### Requirement 6: API Integration for Coach Registration

**User Story:** As a prospective coach, I want my registration submitted to the backend, so that my account is created in the system.

#### Acceptance Criteria

1. WHEN the Registration_Form on the coach page passes client-side validation, THE API_Client SHALL send a POST request to `http://localhost:8082/api/v1/auth/register/coach` within 1 second of the user clicking the submit button
2. THE API_Client SHALL send the request body as JSON with `Content-Type: application/json` header
3. THE API_Client SHALL include the fields `email`, `phoneNumber`, `password`, and `confirmPassword` in the request payload, matching the values entered by the user without modification
4. WHILE the API request is in progress, THE Registration_Form SHALL disable the submit button and display a visible spinner or animation adjacent to or replacing the submit button text
5. IF the API request does not complete within 30 seconds, THEN THE API_Client SHALL abort the request, re-enable the submit button, hide the loading indicator, and display a timeout error message

### Requirement 7: Success Response Handling

**User Story:** As a user, I want to know my registration succeeded, so that I can proceed with the next steps.

#### Acceptance Criteria

1. WHEN the API returns a Success_Response with HTTP status 201, THE Registration_Page SHALL display a success message indicating the account was created and that a verification email has been sent to the registered email address
2. WHEN the API returns a Success_Response, THE Registration_Form SHALL be hidden from view to prevent duplicate submissions, and the submit button SHALL remain disabled
3. WHEN the API returns a Success_Response, THE Registration_Page SHALL display the success message within a Bootstrap `alert` component using the `alert-success` class and styled using existing `--af-*` CSS custom properties to match the site dark theme
4. WHEN the API returns a Success_Response, THE Registration_Page SHALL display the success message within 1 second of receiving the API response

### Requirement 8: Error Response Handling

**User Story:** As a user, I want to see specific error messages from the server, so that I can understand why registration failed and correct the issue.

#### Acceptance Criteria

1. WHEN the API returns an Error_Response with field-level errors, THE Registration_Page SHALL display each field error message below the corresponding form field using Bootstrap invalid-feedback styling, and display any errors whose `field` value does not match a form field name as a general alert above the form
2. WHEN the API returns an Error_Response without field-level errors, THE Registration_Page SHALL display the top-level `message` from the response as a general alert above the Registration_Form using a Bootstrap alert component styled consistently with the site dark theme
3. WHEN the API returns HTTP status 409, THE Registration_Page SHALL display a message indicating the email or phone number is already registered
4. IF a network error occurs during submission (connection refused, DNS failure, or no response received within 30 seconds), THEN THE Registration_Page SHALL display a message "Unable to connect to the server. Please try again later."
5. WHEN an error is displayed, THE Registration_Form SHALL re-enable the submit button and remove the loading indicator to allow the user to correct and resubmit
6. WHEN the user resubmits the Registration_Form, THE Registration_Page SHALL clear all previously displayed error messages before initiating the new request
7. IF the API returns an HTTP status 500 or any unexpected status code not otherwise handled, THEN THE Registration_Page SHALL display a general alert with the message "Something went wrong. Please try again later."

### Requirement 9: Navigation Integration

**User Story:** As a site visitor, I want to easily find the registration pages, so that I can sign up without difficulty.

#### Acceptance Criteria

1. THE Site_Chrome SHALL include a "Register" dropdown or link group in the main navigation containing links to both `register-athlete.html` and `register-coach.html`
2. THE Registration_Page SHALL include a breadcrumb navigation using Bootstrap breadcrumb markup with `aria-label="Breadcrumb"`, showing "Home" linking to `/` followed by "Athlete Registration" or "Coach Registration" as the active item
3. THE Registration_Page SHALL include a visible link below or adjacent to the Registration_Form directing users to the alternative registration page (athlete page links to coach page with text "Register as a Coach instead", and vice versa)

### Requirement 10: Accessibility and Responsive Design

**User Story:** As a user on any device or using assistive technology, I want the registration pages to be usable, so that I can register regardless of my device or abilities.

#### Acceptance Criteria

1. THE Registration_Form SHALL associate all input fields with corresponding `<label>` elements using `for` and `id` attributes
2. THE Registration_Page SHALL include a skip-to-content link as the first focusable element in the DOM, targeting the `<main>` content area by `id`
3. THE Registration_Page SHALL use `aria-live="polite"` on the success alert container, the general error alert container, and each field-level validation message element so screen readers announce dynamic updates
4. THE Registration_Form SHALL render without horizontal overflow and with all form fields, labels, and the submit button visible and operable on viewport widths from 320px to 1400px, using Bootstrap responsive grid classes
5. THE Registration_Page SHALL use the following `autocomplete` attribute values: `email` on the email field, `tel` on the phone number field, and `new-password` on both the password and confirm password fields
6. THE Registration_Form SHALL be fully operable using only a keyboard, with all interactive elements reachable via the Tab key in visual reading order and the submit button activatable via the Enter key
7. THE Registration_Form SHALL indicate validation errors using both text messages and a visible border style, so that error states are not conveyed by color alone
