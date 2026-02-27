# Server — Mental Health Support App API

Express.js REST API with MySQL database for the SEN5002 Personalized Mental Health Support App.

---

## Tech Stack

- **Node.js** + **Express.js** — API framework
- **MySQL** — database
- **bcrypt** — password hashing
- **jsonwebtoken** — JWT authentication
- **swagger-ui-express** — API documentation

---

## Folder Structure

```
server/
├── src/
│   ├── controllers/
│   │   ├── authController.js       ← register and login logic
│   │   ├── moodController.js       ← mood logging and history
│   │   ├── resourcesController.js  ← fetch resources
│   │   └── bookingController.js    ← slots and booking requests
│   ├── middleware/
│   │   └── auth.js                 ← JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js                 ← POST /api/auth/register, /login
│   │   ├── mood.js                 ← POST /api/mood, GET /api/mood/history
│   │   ├── resources.js            ← GET /api/resources
│   │   └── booking.js              ← GET /api/booking/slots, POST /api/booking
│   ├── db/
│   │   ├── connection.js           ← MySQL connection pool
│   │   └── schema.sql              ← database schema and seed data
│   ├── swagger.js                  ← Swagger/OpenAPI config
│   └── index.js                    ← app entry point
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
cd server
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

JWT_SECRET=your-long-random-secret
```

---

## API Endpoints

| Method | Endpoint             | Auth | Description                                     |
|--------|----------------------|------|-------------------------------------------------|
| GET    | `/health`            | No   | Health check                                    |
| POST   | `/api/auth/register` | No   | Register with email + password                  |
| POST   | `/api/auth/login`    | No   | Login, returns JWT token                        |
| POST   | `/api/mood`          | Yes  | Log mood (1–5), returns resources + crisis flag |
| GET    | `/api/mood/history`  | Yes  | Last 30 mood entries                            |
| GET    | `/api/resources`     | Yes  | All mental health resources                     |
| GET    | `/api/booking/slots` | Yes  | Available therapy slots                         |
| POST   | `/api/booking`       | Yes  | Submit a booking request                        |
| GET    | `/api/booking/my`    | Yes  | User's booking history                          |

Full interactive documentation available at `/api-docs` when the server is running.

---

## Database Schema

Six tables:

- **users** — email and bcrypt-hashed password
- **mood_logs** — mood entries (rating 1–5, optional description)
- **resources** — mental health resources with mood range filters
- **saved_resources** — resources saved by users
- **therapy_slots** — available appointment slots
- **bookings** — booking requests with status (pending / confirmed / declined)

The schema is automatically applied when the database container first starts via Docker Compose.

---

## Authentication

Protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued on login and expire after 24 hours.