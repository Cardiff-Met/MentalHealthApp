# 🧠 Mental Health Support App

A full-stack web application providing personalized mental health support for Cardiff Met students, built as part of SEN5002 Agile Development and DevOps.

[![Code Quality Checks](https://github.com/YOUR_USERNAME/MentalHealthApp/actions/workflows/code-quality.yml/badge.svg)](https://github.com/YOUR_USERNAME/MentalHealthApp/actions)
[![Docker Build & Test](https://github.com/YOUR_USERNAME/MentalHealthApp/actions/workflows/docker-test.yml/badge.svg)](https://github.com/YOUR_USERNAME/MentalHealthApp/actions)

---

## 🌟 Features

- **Mood Tracking** - Log daily mood (1-5 scale) with optional notes
- **Crisis Detection** - Automatic crisis support resources when mood is critically low
- **Therapy Booking** - Request appointments with available time slots
- **Resource Library** - Curated mental health resources with filtering
- **Secure Authentication** - JWT-based auth with refresh tokens
- **Responsive Design** - Works on desktop and mobile

---

## 🛠️ Tech Stack

### Frontend (Client)
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **ESLint + Prettier** - Code quality

### Backend (Server)
- **Node.js 20** + **Express.js** - REST API
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Swagger** - API documentation
- **ESLint + Prettier** - Code quality

### DevOps
- **Docker** + **Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Automated Testing** - Lint, format, and Docker checks

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [Node.js 18+](https://nodejs.org/) (optional, for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/MentalHealthApp.git
cd MentalHealthApp
```

### 2. Set Up Environment Variables
```bash
# Create .env file in root
echo "JWT_SECRET=your-super-secret-jwt-key-here" >> .env
echo "REFRESH_SECRET=your-refresh-secret-key-here" >> .env
```

### 3. Start with Docker Compose
```bash
docker compose up --build
```

This starts:
- **MySQL Database** on port 3306
- **Express Server** on port 3000

### 4. Start the Client (separate terminal)
```bash
cd Client
npm install
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 📁 Project Structure

```
MentalHealthApp/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── code-quality.yml    # ESLint + Prettier checks
│       └── docker-test.yml     # Docker build verification
│
├── Client/                     # React frontend
│   ├── src/
│   │   ├── pages/              # Page components (organized in folders)
│   │   ├── context/            # React Context (Auth)
│   │   └── App.jsx             # Main app component
│   ├── eslint.config.js        # ESLint configuration
│   ├── .prettierrc             # Prettier configuration
│   └── vite.config.js          # Vite build config
│
├── Server/                     # Express.js backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Auth middleware
│   │   └── db/                 # Database connection & schema
│   ├── Dockerfile              # Server container config
│   ├── eslint.config.js        # ESLint configuration
│   └── .prettierrc             # Prettier configuration
│
├── docs/                       # Documentation
│   ├── Server.md               # Server API docs
│   └── Client.md               # Client setup docs
│
├── docker-compose.yml          # Multi-container orchestration
├── GITHUB_ACTIONS.md           # CI/CD documentation
└── README.md                   # This file
```

---

## 🔧 Development

### Running Locally (without Docker)

#### Server
```bash
cd Server
npm install

# Create .env file with database credentials
# See Server/.env.example

npm run dev  # Starts on port 3000
```

#### Client
```bash
cd Client
npm install
npm run dev  # Starts on port 5173
```

### Code Quality Checks

Both Client and Server have lint and format scripts:

```bash
# Check for errors
npm run lint
npm run format:check

# Auto-fix errors
npm run lint:fix
npm run format
```

---

## 🔐 Environment Variables

Create a `.env` file in the **root directory**:

```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
```

The docker-compose.yml passes these to the server container.

---

## 📚 API Documentation

When the server is running, visit:

**http://localhost:3000/api-docs**

Interactive Swagger documentation with all endpoints, request/response examples, and authentication details.

See also: [Server Documentation](./docs/Server.md)

---

## 🐳 Docker

### Build and Run
```bash
docker compose up --build
```

### Stop Containers
```bash
docker compose down
```

### Stop and Remove Volumes (fresh start)
```bash
docker compose down -v
```

### View Logs
```bash
docker compose logs server
docker compose logs db
```

---

## 🧪 Testing & CI/CD

### Automated Checks (GitHub Actions)

Every push triggers automated checks:

✅ **Code Quality** - ESLint checks on Client & Server  
✅ **Formatting** - Prettier checks on Client & Server  
✅ **Docker Build** - Verifies containers build and run  
✅ **Security** - npm audit for vulnerabilities (weekly)

View results in the **Actions** tab on GitHub.

### Running Checks Locally

```bash
# Lint checks
cd Client && npm run lint
cd ../Server && npm run lint

# Format checks
cd Client && npm run format:check
cd ../Server && npm run format:check

# Docker test
docker compose up --build
```

See [GITHUB_ACTIONS.md](./docs/GithubActions.md) for details.

---

## 🗄️ Database Schema

Six main tables:
- **users** - User accounts (email, password hash)
- **mood_logs** - Mood tracking entries
- **resources** - Mental health resources
- **saved_resources** - User-saved resources
- **therapy_slots** - Available appointment slots
- **bookings** - Therapy booking requests

Schema is auto-applied on first Docker Compose start via `./Server/src/db/schema.sql`.

---

## 🔑 Key Features

### 1. Mood Tracking
- Log mood on 1-5 scale
- Add optional description
- View mood history
- Crisis detection for low ratings

### 2. Therapy Booking
- Browse available slots
- Filter by time of day (morning/afternoon/evening)
- Submit booking requests
- Track booking status (pending/confirmed/declined)

### 3. Resource Library
- Browse mental health resources
- Filtered by mood range
- Save favorites
- External links to support services

### 4. Crisis Support
- Automatic detection when mood = 1
- Immediate display of crisis helplines
- NHS, Samaritans, Cardiff Met resources

---

## 🔒 Security

- ✅ Password hashing with bcrypt
- ✅ JWT access tokens (15min expiry)
- ✅ Refresh tokens (7 days, httpOnly cookies)
- ✅ Protected API routes
- ✅ Input validation
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries)

---

## 📖 Documentation

- [Server API Documentation](./docs/Server.md) - Detailed API reference
- [Client Documentation](./docs/Client.md) - Frontend setup and structure
- [GitHub Actions Guide](./docs/GithubActions.md) - CI/CD automation

---

## 🎯 Development Workflow

### 1. Create a branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make changes
```bash
# Code your feature
```

### 3. Check quality locally
```bash
cd Client && npm run lint:fix && npm run format
cd ../Server && npm run lint:fix && npm run format
```

### 4. Commit and push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 5. Check GitHub Actions
- Go to **Actions** tab
- Verify all checks pass ✅

### 6. Create Pull Request
- Open PR on GitHub
- Automated checks run
- Merge when green ✅

---

## 🛠️ Scripts Reference

### Client
```bash
npm run dev           # Start dev server (port 5173)
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted
```

### Server
```bash
npm start             # Start production server
npm run dev           # Start with nodemon (auto-reload)
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted
```

### Docker
```bash
docker compose up --build    # Build and start all services
docker compose down          # Stop all services
docker compose down -v       # Stop and remove volumes
docker compose logs server   # View server logs
docker compose logs db       # View database logs
docker compose ps            # List running containers
```

---

## 🐛 Troubleshooting

### Docker issues

**Containers won't start:**
```bash
docker compose down -v
docker compose up --build
```

**Can't connect to database:**
- Check if port 3306 is already in use
- Verify environment variables in docker-compose.yml

**Server crashes on startup:**
```bash
docker compose logs server
```

### Client issues

**Page not loading:**
- Check if Vite dev server is running on port 5173
- Verify API proxy in `vite.config.js`

**API calls fail:**
- Ensure server is running on port 3000
- Check browser console for CORS errors

### ESLint/Prettier issues

**Checks failing:**
```bash
npm run lint:fix
npm run format
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run lint and format checks
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

All PRs must pass automated checks before merging.

---

## 📝 License

This project is part of Cardiff Metropolitan University coursework for SEN5002 Agile Development and DevOps.

---

## 👥 Authors

- Cardiff Met Students - SEN5002 Module

---

## 🙏 Acknowledgments

- Mental health resources provided by NHS, Samaritans, and Cardiff Met Wellbeing
- Built for educational purposes as part of Agile Development coursework

---

## 📞 Support Resources

**Crisis Support:**
- **Samaritans**: 116 123 (24/7, free)
- **NHS Urgent Mental Health**: 111 (option 2)
- **Cardiff Met Wellbeing**: [cardiffmet.ac.uk/wellbeing](https://www.cardiffmet.ac.uk/wellbeing)

---

## 🔗 Links

- [API Documentation](http://localhost:3000/api-docs) (when server running)
- [Server Docs](./docs/Server.md)
- [Client Docs](./docs/Client.md)
- [GitHub Actions](./docs/GithubActions.md)


