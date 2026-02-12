# SEN5002 – Assessment Point 1
## Workshop Week 2: Software Product Management and Prototyping
**Project:** Personalized Mental Health Support App

---

# 1. Team Details and Confirmed Roles

| Name | Student | Role |
|------|------------|------|
| Student 1 | Noe | Product Owner & Scrum Master |
| Student 2 | Luca | DevOps & QA Lead |

---

# 2. Product Vision (Final)

**FOR** university students studying in Cardiff
**WHO** experience stress, anxiety, or mental health challenges and need accessible support
**THE** Personalized Mental Health Support App **IS A** digital mental health support platform
**THAT** delivers personalised self-help resources, therapy session booking, and immediate chatbot support
**UNLIKE** generic mental health websites or fragmented university support systems
**OUR PRODUCT** integrates local Cardiff services with AI-driven personalisation while prioritising student privacy and data security

---

# 3. Product Management Section

## 3.1 Responsibility Map

### Product Owner & Scrum Master

**Weekly Responsibilities**
- Maintain and prioritise the product backlog
- Ensure alignment with product vision
- Organise sprint planning and weekly reviews
- Track roadmap progress
- Make scope decisions

**Decision Authority**
- Final decision on backlog priority
- Final decision on scope trade-offs

---

### DevOps & QA Lead

**Weekly Responsibilities**
- Maintain GitHub repository and branching workflow
- Support Docker container configuration
- Set up and maintain CI pipeline
- Ensure automated tests are written and tracked
- Record testing and security evidence

**Decision Authority**
- Technical tooling choices
- CI/CD and container configuration

---

### Disagreement Resolution Process

1. Team discussion
2. Time-limited vote
3. Product Owner final decision if unresolved

---

## 3.2 Roadmap and Timeline (Weeks 1–10)

### Week 1
- Product Vision completed
- Initial backlog defined

### Week 2 (Assessment Point 1 Submission)
- Confirm roles and responsibilities
- Produce roadmap
- Create low-fidelity prototypes
- Submit combined document

### Week 3
- Convert epics into detailed user stories
- Define acceptance criteria
- Prioritise backlog

### Week 4
- Set up GitHub repository
- Implement authentication API (register/login)
- Create initial database schema
- Deliver first working API endpoint

### Week 5
- Connect client to server (first end-to-end feature)
- Implement mood input feature
- Begin automated testing

### Week 6
- Implement personalised resource logic
- Docker container setup
- Configure basic CI pipeline

### Week 7 (Assessment Point 2 Milestone)
- Demonstrate working core features
- Evidence of branching and pull requests
- Document Agile process

### Week 8
- Implement therapy booking system
- Conduct security review (JWT, hashing, validation)
- Increase test coverage

### Week 9
- Apply Test-Driven Development to at least one feature
- Document functional testing
- Prepare run/deployment guide

### Week 10 (Assessment Point 3 Submission)
- Final testing and bug fixes
- Security checks
- Complete documentation
- Submitfinal product and report 

---

## 3.3 Risks and Assumptions

### Key Risks
- Scope expansion beyond minimum usable version
- Limited development capacity (2-person team)
- Client–server integration issues
- Security misconfiguration

### Assumptions
- Users access via web browser
- PostgreSQL used for secure data storage
- JWT-based authentication implemented
- Personalisation uses rule-based or lightweight sentiment analysis

---

# 4. Product Prototype Section

## 4.1 Primary User Journey

**Primary Journey:**
Student logs in → records mood → receives personalised resources → books support session.

This represents the minimum usable version delivering core value.

---

## 4.2 Low-Fidelity Mock-Ups (Screen Specifications)

> Replace this section with screenshots or photos of your actual wireframes when ready.

---

### Screen 1 – Login / Register

**Purpose:** Authenticate user securely.

**Inputs**
- Email
- Password
- Login button
- Register button

**Validation**
- Invalid email format
- Incorrect password
- Required fields

---

### Screen 2 – Dashboard

**Purpose:** Central user hub after login.

**Displays**
- Welcome message
- “Record Mood” button
- Recommended resources
- Upcoming bookings

**Error State**
- No recommendations available

---

### Screen 3 – Mood Input

**Purpose:** Allow user to log emotional state.

**Inputs**
- Mood rating (1–5 scale)
- Optional text description
- Submit button

**Output**
- Confirmation message
- Trigger personalised recommendations

---

### Screen 4 – Resources Page

**Purpose:** Display tailored mental health resources.

**Displays**
- Resource title
- Short description
- Link button

**Access Note**
- Available to authenticated users only

---

### Screen 5 – Booking Page

**Purpose:** Allow therapy session booking.

**Inputs**
- Service selection
- Date picker
- Time slot selection
- Confirm booking button

**Validation**
- Unavailable time slot
- Required field errors

---

## 4.3 Alignment Check

| Must-Have Capability | Roadmap Delivery | Prototype Representation |
|----------------------|------------------|--------------------------|
| Secure user registration | Week 4 | Login Screen |
| Personalised support | Weeks 5–6 | Mood + Resources Screens |
| Therapy booking | Week 8 | Booking Screen |

All must-have capabilities are represented in:
- The roadmap
- The prototype
- The primary user journey

---

# 5. Summary

This document forms the complete **Assessment Point 1 submission**, covering:

- Product Vision
- Product Management (roles and roadmap)
- Risks and assumptions
- Low-fidelity prototype description
- Primary user journey

It establishes a structured Agile foundation for implementation in Weeks 3–10.
