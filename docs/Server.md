# Server — MindSpace API

Express 5 REST API with MySQL 8 database for the SEN5002 Mental Health Support App.

---

## Tech Stack

- **Node.js 20** + **Express 5** — REST API framework
- **MySQL 8** — relational database
- **bcrypt** — password hashing (cost 12)
- **jsonwebtoken** — JWT access + refresh token authentication
- **helmet** — HTTP security headers
- **express-rate-limit** — rate limiting
- **cookie-parser** — refresh token cookie handling
- **swagger-ui-express** + **swagger-jsdoc** — interactive API docs
- **Jest** + **supertest** — test suite (14 suites, 164 tests)

---

## Folder Structure

```
Server/
├── src/
│   ├── controllers/
│   │   ├── authController.js          ← register, login, refresh, logout
│   │   ├── moodController.js          ← log mood + 30-day history
│   │   ├── resourcesController.js     ← list, save, unsave resources
│   │   ├── bookingController.js       ← slots, bookings, cancel
│   │   ├── userController.js          ← profile, change password, GDPR export, delete
│   │   ├── passwordResetController.js ← forgot/reset password
│   │   ├── therapistController.js     ← therapist slots and bookings
│   │   └── adminController.js         ← user/resource/booking admin
│   ├── middleware/
│   │   ├── auth.js                    ← JWT authentication middleware
│   │   ├── requireAdmin.js            ← admin role guard
│   │   └── requireTherapist.js        ← therapist role guard
│   ├── routes/
│   │   ├── auth.js                    ← /api/auth/*
│   │   ├── mood.js                    ← /api/mood/*
│   │   ├── resources.js               ← /api/resources/*
│   │   ├── booking.js                 ← /api/booking/*
│   │   ├── users.js                   ← /api/users/*
│   │   ├── therapist.js               ← /api/therapist/*
│   │   └── admin.js                   ← /api/admin/*
│   ├── db/
│   │   ├── connection.js              ← MySQL connection pool
│   │   ├── schema.sql                 ← database schema and seed data
│   │   └── migrate.js                 ← idempotent runtime migrations
│   ├── utils/
│   │   ├── validation.js              ← email/password/mood validators
│   │   └── audit.js                   ← append-only audit log writer
│   ├── __tests__/                     ← 14 test suites, 164 tests
│   ├── swagger.js                     ← Swagger/OpenAPI config
│   ├── app.js                         ← Express app setup
│   └── index.js                       ← server entry point
├── Dockerfile
├── .dockerignore
├── .env.example
└── package.json
```

---

## Prerequisites

- Node.js 20+
- Docker Desktop

---

## Running with Docker Compose (recommended)

From the **root** of the project:

```bash
docker compose up --build
```

This starts both the server and MySQL database together.

- Server: http://localhost:3000
- API docs: http://localhost:3000/api-docs

To stop:

```bash
docker compose down
```

---

## Running Locally (without Docker)

```bash
cd Server
cp .env.example .env      # fill in your MySQL credentials
npm install
npm run dev               # starts with nodemon on port 3000
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
PORT=3000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mental_health_app

JWT_SECRET=<min-32-char-random-string>
REFRESH_SECRET=<min-32-char-random-string>
NODE_ENV=development
```

The server fails fast at boot if `JWT_SECRET` is missing or shorter than 32 chars.

---

## API Endpoints

35 endpoints across 7 route files.

### Auth (`/api/auth/*`)

| Method | Endpoint                       | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| POST   | `/api/auth/register`           | No   | Create an account                    |
| POST   | `/api/auth/login`              | No   | Login, returns access + refresh JWT  |
| POST   | `/api/auth/refresh`            | No   | Issue new access token from cookie   |
| POST   | `/api/auth/logout`             | No   | Clear refresh cookie                 |
| POST   | `/api/auth/forgot-password`    | No   | Request password reset email         |
| POST   | `/api/auth/reset-password`     | No   | Submit new password with reset token |

### Mood (`/api/mood/*`)

| Method | Endpoint              | Auth | Description                                     |
|--------|-----------------------|------|-------------------------------------------------|
| POST   | `/api/mood`           | Yes  | Log mood (1–5), returns resources + crisis flag |
| GET    | `/api/mood/history`   | Yes  | Last 30 mood entries                            |

### Resources (`/api/resources/*`)

| Method | Endpoint                      | Auth | Description                       |
|--------|-------------------------------|------|-----------------------------------|
| GET    | `/api/resources`              | Yes  | All resources, optional filters   |
| GET    | `/api/resources/saved`        | Yes  | Resources the user has saved      |
| POST   | `/api/resources/:id/save`     | Yes  | Save a resource                   |
| DELETE | `/api/resources/:id/save`     | Yes  | Unsave a resource                 |

### Booking (`/api/booking/*`)

| Method | Endpoint              | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/api/booking/slots`  | Yes  | Available therapy slots                  |
| POST   | `/api/booking`        | Yes  | Submit a booking request                 |
| GET    | `/api/booking/my`     | Yes  | User's booking history                   |
| DELETE | `/api/booking/:id`    | Yes  | Cancel a pending booking                 |

### Users (`/api/users/*`)

| Method | Endpoint                    | Auth | Description                              |
|--------|-----------------------------|------|------------------------------------------|
| GET    | `/api/users/me`             | Yes  | Get own profile                          |
| PATCH  | `/api/users/me`             | Yes  | Update name / email                      |
| PATCH  | `/api/users/me/password`    | Yes  | Change password (requires current)       |
| DELETE | `/api/users/me`             | Yes  | Soft-delete account (GDPR erasure)       |
| GET    | `/api/users/me/export`      | Yes  | Export all personal data as JSON (GDPR)  |

### Therapist (`/api/therapist/*`) — `therapist` role

| Method | Endpoint                       | Auth | Description                       |
|--------|--------------------------------|------|-----------------------------------|
| GET    | `/api/therapist/slots`         | Yes  | List own availability slots       |
| POST   | `/api/therapist/slots`         | Yes  | Add a slot                        |
| DELETE | `/api/therapist/slots/:id`     | Yes  | Remove a slot                     |
| GET    | `/api/therapist/bookings`      | Yes  | List bookings on own slots        |
| PATCH  | `/api/therapist/bookings/:id`  | Yes  | Confirm or decline a booking      |

### Admin (`/api/admin/*`) — `admin` role

| Method | Endpoint                       | Auth | Description                       |
|--------|--------------------------------|------|-----------------------------------|
| GET    | `/api/admin/users`             | Yes  | List all users                    |
| PATCH  | `/api/admin/users/:id/role`    | Yes  | Change a user's role              |
| GET    | `/api/admin/resources`         | Yes  | List all resources                |
| POST   | `/api/admin/resources`         | Yes  | Create a resource                 |
| PATCH  | `/api/admin/resources/:id`     | Yes  | Update a resource                 |
| DELETE | `/api/admin/resources/:id`     | Yes  | Delete a resource                 |
| GET    | `/api/admin/bookings`          | Yes  | List all bookings                 |
| PATCH  | `/api/admin/bookings/:id`      | Yes  | Confirm / decline any booking     |

### Health

| Method | Endpoint   | Auth | Description    |
|--------|------------|------|----------------|
| GET    | `/health`  | No   | Health check   |

Full interactive documentation available at `/api-docs` when the server is running.

---

## Database Schema

8 tables, charset `utf8mb4`:

- **users** — email, bcrypt password, role (`user` / `therapist` / `admin`), soft-delete column
- **mood_logs** — mood entries (rating 1–5, optional description)
- **resources** — curated mental health resources with category and mood range
- **saved_resources** — user ↔ resource saves
- **therapy_slots** — therapist availability
- **bookings** — booking requests with status (`pending` / `confirmed` / `declined`)
- **password_resets** — SHA-256 hashed reset tokens with expiry and used-at timestamp
- **audit_log** — append-only security event log

Schema is applied on first DB container start via Docker Compose. Idempotent runtime migrations (`migrate.js`) reconcile column-level changes.

### Seeded accounts

| Role      | Email                          | Password         |
|-----------|--------------------------------|------------------|
| Admin     | admin@cardiffmet.ac.uk         | Admin1234!       |
| Therapist | therapist@cardiffmet.ac.uk     | Therapist1234!   |

8 mental health resources are also seeded. Therapy slots are not pre-seeded — therapists add their own through the app.

---

## Authentication

Protected routes require a JWT access token in the `Authorization` header:

```
Authorization: Bearer <token>
```

- Access tokens expire after **15 minutes**
- Refresh tokens are stored in an `httpOnly` + `sameSite=strict` cookie, valid for **7 days**
- `POST /api/auth/refresh` issues a new access token using the refresh cookie

---

## Security

- **Helmet** for HTTP security headers (CSP, HSTS, X-Frame-Options)
- **Rate limiting** — 50 req/15 min on `/api/auth/*`, 500 req/15 min global
- **Body size cap** — 100 KB
- **Parameterised queries** throughout — no SQL string concatenation
- **Audit log** — login, logout, password changes, account deletion, admin actions
- **JWT secret enforcement** — server refuses to boot if `JWT_SECRET` < 32 chars
