# Client — Mental Health Support App

React + Vite frontend for the SEN5002 Personalized Mental Health Support App.

---

## Tech Stack

- **React** — UI framework
- **Vite** — build tool and dev server
- **react-router-dom** — page navigation

---

## Folder Structure

```
client/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx     ← JWT token storage and auth state
│   ├── pages/
│   │   ├── LoginPage.jsx       ← login and register
│   │   ├── DashboardPage.jsx   ← home page after login
│   │   ├── MoodPage.jsx        ← mood logging + crisis panel + resources
│   │   ├── ResourcesPage.jsx   ← browse all resources
│   │   └── BookingPage.jsx     ← therapy slot booking
│   ├── App.jsx                 ← routes and protected route logic
│   └── main.jsx                ← app entry point
├── vite.config.js
└── package.json
```

---

## Prerequisites

- Node.js 20+
- Server must be running (see server README)

---

## Running Locally

```bash
cd client
npm install
npm run dev
```

Opens at: http://localhost:5173

---

## Pages

| Route        | Page                 | Auth Required |
|--------------|----------------------|---------------|
| `/login`     | Login and Register   | No            |
| `/dashboard` | Dashboard            | Yes           |
| `/mood`      | Log Mood             | Yes           |
| `/resources` | Browse Resources     | Yes           |
| `/booking`   | Book Therapy Session | Yes           |

Any route that requires auth will redirect to `/login` if no token is present.

---

## How Authentication Works

1. User logs in on `/login` — the server returns a JWT token
2. The token is stored in `localStorage` via `AuthContext`
3. Every API request to a protected endpoint sends the token in the `Authorization: Bearer <token>` header
4. On logout the token is removed from `localStorage` and the user is redirected to `/login`

---

## API Proxy

All API requests go through Vite's proxy to avoid CORS issues in development:

```
/api/* → http://localhost:3000/api/*
```

This is configured in `vite.config.js`. In production this would be handled by a reverse proxy like Nginx.

---

## Key Features

- **Login / Register** — secure authentication with JWT
- **Mood Logging** — rate mood 1–5 with optional description
- **Crisis Panel** — automatically shown when mood rating is 1, displays Samaritans, NHS, and Cardiff Met contacts
- **Personalised Resources** — resources matched to mood rating returned after each log
- **Resource Browser** — browse and save all available resources
- **Therapy Booking** — view available slots filtered by time of day, submit booking requests