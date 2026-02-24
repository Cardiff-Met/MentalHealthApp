# SEN5002 – Assessment Point 2
## Workshop Week 4: User Stories and Feature Prioritisation
**Project:** Personalized Mental Health Support App

---

# 1. Introduction

This document presents the user story backlog, acceptance criteria, feature groupings, and prioritisation for the Personalized Mental Health Support App. It is derived directly from the five personas and five usage scenarios defined in Week 3, and forms the complete **Assessment Point 2** submission.

---

# 2. User Stories

User stories follow the format: **As a (user), I want (goal), so that (benefit).**

This backlog contains 17 user stories covering all five personas.

---

## Emily – Primary User (Student under academic stress)

**E1** – As a student, I want to log my mood with a rating and optional description, so that I can track how I am feeling over time.

**E2** – As a student, I want to receive personalised resource recommendations after logging my mood, so that I get relevant support quickly without searching manually.

**E3** – As a student, I want to register for an account using my email and password, so that my data is kept private and linked to me.

**E4** – As a student, I want to log in securely and remain logged in during my session, so that I do not have to re-authenticate every time I use the app.

---

## Daniel – Secondary User (Postgraduate seeking a booking)

**D1** – As a student, I want to browse available therapy session slots on a calendar, so that I can choose a time that fits my schedule.

**D2** – As a student, I want to submit a booking request for a therapy session, so that I can start the process of getting professional support.

**D3** – As a student, I want to view the current status of my booking (Pending, Confirmed, or Declined), so that I know whether my appointment has been accepted.

**D4** – As a student, I want to be prompted to choose another slot when my booking is declined, so that I can quickly reschedule without confusion.

---

## Aisha – Edge-Case User (International student, first-time user)

**A1** – As a student, I want to browse mental health resources without being required to book anything, so that I can explore support options privately before committing.

**A2** – As a student, I want the app to use plain, clear language throughout, so that I can understand my options without needing specialist knowledge.

**A3** – As a student, I want to be reassured that my data is private during registration, so that I feel safe using the app without fear of stigma.

**A4** – As a student, I want to save a resource I find helpful, so that I can return to it later without searching again.

---

## Marcus – Mature/Part-Time Student (Limited time, lower tech confidence)

**M1** – As a part-time student, I want to filter available booking slots by time of day (e.g. evenings), so that I can find appointments that fit around my work and family commitments.

**M2** – As a part-time student, I want the app to remember my login between sessions, so that I do not have to re-enter my credentials every time I have a few spare minutes.

**M3** – As a part-time student, I want the key actions (log mood, book session) to be reachable in no more than two taps or clicks from the dashboard, so that I can complete tasks quickly within a short time window.

---

## Sophie – Student in Crisis / Urgent Need

**S1** – As a student in acute distress, I want the app to automatically display crisis support resources when I log a critically low mood, so that I can find urgent help immediately without having to navigate to find it.

**S2** – As a student in crisis, I want to see clearly displayed emergency contact numbers (Samaritans, university crisis line, NHS urgent support) on the crisis panel, so that I can contact help in one step.

---

# 3. Acceptance Criteria

---

## E1 – Log mood

- The system must present a mood rating scale (1–5) and an optional text description field.
- The system must accept a submission with only the rating (description is optional).
- The system must display a confirmation message after a mood entry is submitted.
- If the user submits without selecting a rating, the system must display a validation error and prevent submission.

---

## E2 – Receive personalised recommendations

- The system must display at least one resource recommendation after a mood entry is submitted.
- Recommendations must differ for a mood rating of 1–2 versus 4–5, demonstrating personalisation.
- If no recommendations are available for a given mood, the system must display a fallback message rather than a blank screen.

---

## E3 – Register an account

- The system must allow a user to register with a valid email address and a password of at least 8 characters.
- The system must reject registration if the email format is invalid and display a clear error message.
- The system must reject registration if the password does not meet the minimum length requirement.
- The system must not store passwords in plain text (bcrypt hashing required).
- If a user attempts to register with an email already in use, the system must display an appropriate message and block duplicate registration.

---

## E4 – Log in securely

- The system must allow a registered user to log in with their email and password.
- The system must reject login with an incorrect password and display a generic error (not revealing which field is wrong).
- The system must issue a JWT token on successful login and maintain the session for the duration of the browser session.
- After 3 consecutive failed login attempts, the system must display a warning message.

---

## D1 – Browse therapy slots

- The system must display available appointment slots in a calendar or list view.
- Slots that are already pending or confirmed for another student must not appear as "Available".
- If no slots are available, the system must display a clear "No slots currently available" message.

---

## D2 – Submit a booking request

- The system must allow a logged-in student to select an available slot and submit a booking request.
- The system must create a booking record with status `Pending` immediately after submission.
- The system must display a confirmation message informing the student their request is pending review.
- If the slot is taken between the student selecting it and submitting (race condition), the system must display: "This time slot is no longer available. Please select another."

---

## D3 – View booking status

- The system must display the current booking status (Pending / Confirmed / Declined) on the dashboard and booking status page.
- If Confirmed, the system must show the appointment date, time, and relevant service contact details.
- If Pending, the system must display: "We will notify you when confirmed."
- Status must update when the user navigates to the status page without requiring a full page reload.

---

## D4 – Reschedule after decline

- When a booking is Declined, the system must display the reason (if available) and a "Choose another slot" button.
- Clicking "Choose another slot" must return the student to the booking calendar with all available slots shown.
- The previously declined slot must be released and appear as available again.

---

## A1 – Browse resources without booking

- The system must allow a logged-in user to access the resources page without initiating a booking.
- Resources must be accessible from the dashboard and the navigation menu.
- The resources page must not display prompts that pressure the user to book a session.

---

## A2 – Plain language throughout

- All labels, button text, and error messages must be written in plain English without clinical jargon.
- Any tooltip or description must be written at an accessible reading level.
- At least one team member or third party unfamiliar with the project must confirm the language is clear during user testing.

---

## A3 – Privacy reassurance during registration

- The registration screen must include a visible privacy statement or link explaining how data is handled.
- The statement must reference GDPR compliance and confirm data will not be shared without consent.
- The system must not display a student's personal details on any publicly accessible page.

---

## A4 – Save a resource

- The system must allow a logged-in user to save a resource from the resources page.
- Saved resources must be accessible from a dedicated "Saved" section or via the dashboard.
- If the user tries to save a resource they have already saved, the system must display "Already saved" and not duplicate it.
- Saved resources must persist across sessions (stored server-side, not in browser memory only).

---

## M1 – Filter booking slots by time of day

- The system must provide a filter option on the booking calendar allowing the user to show only morning, afternoon, or evening slots.
- The filter must update the displayed slots immediately without a page reload.
- If no slots exist within the selected time filter, the system must display: "No slots available for this time period. Try a different filter."

---

## M2 – Remembered login between sessions

- The system must offer a "Remember me" option on the login screen.
- If selected, the user must remain logged in across browser sessions until they explicitly log out.
- If not selected, the session must expire when the browser is closed.
- The remembered session must be implemented securely (e.g. persistent JWT with appropriate expiry, stored in an httpOnly cookie).

---

## M3 – Key actions reachable within two steps from dashboard

- The "Record Mood" action must be accessible directly from the dashboard in one click.
- The "Book a session" action must be accessible directly from the dashboard in one click.
- A user must be able to complete a mood log from the dashboard within 3 interactions (click → input → submit).
- Navigation must not require more than two levels of menu depth to reach any core feature.

---

## S1 – Automatic crisis support trigger on critically low mood

- When a user submits a mood rating of 1, the system must immediately display a crisis support panel or overlay before showing standard resource recommendations.
- The crisis panel must appear without requiring any additional navigation from the user.
- The crisis panel must include a heading that clearly identifies it as urgent support information (e.g. "Immediate Support Available").
- The system must not suppress or delay the crisis panel in favour of other content.

---

## S2 – Display emergency contact numbers on crisis panel

- The crisis panel must display at minimum: Samaritans (116 123), the university out-of-hours crisis line, and NHS urgent mental health support (111 option 2).
- Contact numbers must be displayed as tappable/clickable links on mobile devices.
- The panel must include a brief plain-language description of what each service provides.
- The crisis panel must be dismissible by the user, but must require a deliberate action to close (e.g. "I understand, continue to resources" button — not an accidental tap).

---

# 4. Feature Identification

Stories are grouped into four features, with a new dedicated crisis support feature added based on insights from Scenario 5.

---

## Feature F1 – Secure Authentication and Account Management

**Description:** Students can register, log in, and maintain a secure session. Personal data is handled in a GDPR-compliant way with privacy reassurance throughout. Supports remembered login for time-pressured users.

**Includes stories:** E3, E4, A3, M2

**Priority: Must Have**

---

## Feature F2 – Mood Tracking and Personalised Resources

**Description:** Students can log their current mood and immediately receive personalised mental health resources. Resources can be browsed freely without booking, saved for later, and are presented in plain, accessible language.

**Includes stories:** E1, E2, A1, A2, A4, M3

**Priority: Must Have**

---

## Feature F3 – Therapy Session Booking and Status

**Description:** Students can view available therapy slots (with time-of-day filtering), submit a booking request, and track the status of their request (Pending / Confirmed / Declined). Declined bookings allow fast rescheduling.

**Includes stories:** D1, D2, D3, D4, M1

**Priority: Must Have**

---

## Feature F4 – Crisis Detection and Emergency Signposting

**Description:** When a student logs a critically low mood (rating of 1), the app automatically surfaces a crisis support panel with emergency contact numbers and plain-language descriptions of urgent services. This feature addresses safeguarding obligations and ensures no user in acute distress is left without immediate signposting.

**Includes stories:** S1, S2

**Priority: Must Have**

---

# 5. Feature Prioritisation Summary

| Feature | Description | Priority |
|---------|-------------|----------|
| F1 – Secure Authentication | Register, login, session management, privacy | **Must Have** |
| F2 – Mood Tracking & Resources | Mood input, recommendations, save resources | **Must Have** |
| F3 – Therapy Booking & Status | Slot selection, request, status tracking, time filtering | **Must Have** |
| F4 – Crisis Detection & Signposting | Auto crisis panel on low mood, emergency contacts | **Must Have** |
| Notification / reminder system | Email or in-app alerts for booking status updates | Should Have |
| Chatbot support | Immediate text-based support via chatbot | Should Have |
| Resource filtering by category | Filter resources by topic (anxiety, stress, sleep) | Could Have |
| Mood trend chart | Visualise mood logs over time as a chart | Could Have |

---

# 6. Traceability: Personas → Scenarios → Stories → Features

| Persona | Scenario | User Stories | Feature(s) |
|---------|----------|--------------|------------|
| Emily (Primary) | Mood logging under pressure | E1, E2, E3, E4 | F1, F2 |
| Daniel (Secondary) | Booking request and status tracking | D1, D2, D3, D4 | F1, F3 |
| Aisha (Edge-case) | Private resource exploration | A1, A2, A3, A4 | F1, F2 |
| Marcus (Mature/Part-time) | Quick access in a limited time window | M1, M2, M3 | F1, F2, F3 |
| Sophie (Crisis) | Urgent support during acute distress | S1, S2 | F2, F4 |

Each persona has at least one scenario, two user stories, and at least one feature they directly benefit from.

---

# 7. Full Backlog Table

| ID | Persona | User Story | AC Count | Feature | Priority |
|----|---------|-----------|----------|---------|----------|
| E1 | Emily | Log mood with rating and description | 4 | F2 | Must Have |
| E2 | Emily | Receive personalised recommendations | 3 | F2 | Must Have |
| E3 | Emily | Register with email and password | 5 | F1 | Must Have |
| E4 | Emily | Log in securely with JWT session | 4 | F1 | Must Have |
| D1 | Daniel | Browse available therapy slots | 3 | F3 | Must Have |
| D2 | Daniel | Submit a booking request | 4 | F3 | Must Have |
| D3 | Daniel | View booking status | 4 | F3 | Must Have |
| D4 | Daniel | Reschedule after a declined booking | 3 | F3 | Must Have |
| A1 | Aisha | Browse resources without booking | 3 | F2 | Must Have |
| A2 | Aisha | Plain language throughout | 3 | F2 | Should Have |
| A3 | Aisha | Privacy reassurance during registration | 3 | F1 | Must Have |
| A4 | Aisha | Save a helpful resource | 4 | F2 | Should Have |
| M1 | Marcus | Filter booking slots by time of day | 3 | F3 | Should Have |
| M2 | Marcus | Remembered login between sessions | 4 | F1 | Should Have |
| M3 | Marcus | Key actions reachable in two steps | 4 | F2 | Should Have |
| S1 | Sophie | Auto crisis panel on mood rating of 1 | 4 | F4 | Must Have |
| S2 | Sophie | Emergency contacts on crisis panel | 4 | F4 | Must Have |

---

# 8. Summary

This document completes the **Assessment Point 2 requirements pack**, containing:
- 17 user stories covering all five personas
- Acceptance criteria for every story (3–5 conditions each), including error and edge cases
- 4 features aligned to the product epics, prototype screens, and insights from user scenarios
- Full Must / Should / Could prioritisation
- Complete traceability from personas → scenarios → stories → features

A new Feature F4 (Crisis Detection and Emergency Signposting) was identified through Scenario 5 (Sophie) and is classified as Must Have given the safeguarding responsibilities of a mental health application.

The backlog is ready to inform sprint planning starting in Week 5.
