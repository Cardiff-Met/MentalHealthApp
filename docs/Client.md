# Client — MindSpace Frontend

React 19 + Vite frontend for the SEN5002 Mental Health Support App.

---

## Tech Stack

- **React 19** — UI library
- **Vite** — build tool and dev server
- **React Router v7** — client-side routing
- **Tailwind CSS v4** — styling
- **Recharts** — mood history line chart
- **Vitest** + **Testing Library** — component and page tests
- **ESLint** + **Prettier** — code quality

---

## Folder Structure

```
Client/
├── public/
│   ├── robots.txt              ← SEO crawler rules
│   └── vite.svg                ← favicon
├── src/
│   ├── components/
│   │   ├── AppShell.jsx        ← top nav, sidebar, mobile menu
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBanner.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/
│   │   ├── AuthContext.jsx     ← JWT access token + refresh cookie auth state
│   │   ├── useAuth.js
│   │   └── index.js
│   ├── pages/
│   │   ├── LoginPage/          ← login, register, forgot/reset password
│   │   ├── DashboardPage/      ← home page after login
│   │   ├── MoodPage/           ← mood logging + crisis panel + resources
│   │   ├── MoodHistoryPage/    ← 30-day mood trend chart
│   │   ├── ResourcesPage/      ← browse and save all resources
│   │   ├── BookingPage/        ← therapy slot booking
│   │   ├── ProfilePage/        ← profile, change password, GDPR export, delete
│   │   ├── TherapistPage/      ← therapist availability calendar
│   │   └── AdminPage/          ← admin dashboard (users, bookings, resources)
│   ├── test/                   ← Vitest + Testing Library tests
│   ├── App.jsx                 ← routes and protected route logic
│   ├── main.jsx                ← app entry point
│   └── index.css               ← Tailwind base styles
├── index.html                  ← page title, meta description, theme colour
├── vite.config.js
└── package.json
```

---

## Prerequisites

- Node.js 20+
- Server must be running (see [`Server.md`](./Server.md))

---

## Running Locally

```bash
cd Client
npm install
npm run dev
```

Opens at: http://localhost:5173

### Production build

```bash
npm run build       # outputs to dist/
npm run preview     # serves the build on localhost:4173
```

---

## Pages

| Route             | Page                       | Auth Required | Role           |
|-------------------|----------------------------|---------------|----------------|
| `/login`          | Login / Register / Reset   | No            | —              |
| `/dashboard`      | Dashboard                  | Yes           | any            |
| `/mood`           | Log Mood                   | Yes           | any            |
| `/mood/history`   | 30-day mood trend          | Yes           | any            |
| `/resources`      | Browse and save resources  | Yes           | any            |
| `/booking`        | Book a therapy session     | Yes           | any            |
| `/profile`        | Profile + GDPR controls    | Yes           | any            |
| `/therapist`      | Therapist availability     | Yes           | `therapist`    |
| `/admin`          | Admin dashboard            | Yes           | `admin`        |

Any route that requires auth will redirect to `/login` if no token is present. Role-restricted routes redirect to `/dashboard` if the user lacks the required role.

---

## How Authentication Works

1. User logs in on `/login` — the server returns a short-lived JWT access token + sets an `httpOnly` refresh cookie
2. Access token is stored in memory via `AuthContext` (not `localStorage`, for XSS resilience)
3. Every API request to a protected endpoint sends the token in `Authorization: Bearer <token>`
4. When the access token expires, `authFetch` silently calls `/api/auth/refresh` using the cookie to get a new one
5. On logout the access token is cleared and `/api/auth/logout` clears the refresh cookie

---

## API Proxy

All API requests go through Vite's proxy to avoid CORS issues in development:

```
/api/* → http://localhost:3000/api/*
```

This is configured in `vite.config.js`. In production this would be handled by a reverse proxy like Nginx.

---

## Key Features

- **Login / Register / Forgot password** — JWT auth with refresh cookies
- **Mood Logging** — rate mood 1–5 with optional description
- **Crisis Panel** — automatically shown when mood rating is 1, displays Samaritans, NHS, and Cardiff Met contacts
- **Personalised Resources** — resources matched to mood rating returned after each log
- **Mood History** — 30-day trend chart (Recharts line graph)
- **Resource Browser** — category filter, save-for-later
- **Therapy Booking** — view available slots filtered by time of day, submit booking requests, view booking status
- **Profile / GDPR** — change name/email/password, export all data as JSON, soft-delete account
- **Therapist Calendar** — add/remove availability slots with conflict detection and past-date guards
- **Admin Dashboard** — manage users (assign roles), CRUD resources, confirm/decline bookings

---

## Accessibility

- Skip-to-main-content link
- ARIA landmarks and labels throughout
- Focus rings on all interactive elements
- Mobile-responsive hamburger navigation
- Lazy-loaded heavy pages

Lighthouse scores on the production build: **Performance 100, Accessibility 96, Best Practices 100, SEO 100**.

---

## Testing

```bash
npm test            # run Vitest suite
```
