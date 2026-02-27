# GitHub Actions - Automated Checks

## What's Running

Three GitHub Actions workflows automatically check your code on every push:

### 1. Code Quality (ESLint)
- Checks code quality and best practices
- Runs on both Client and Server
- Tests on Node 18.x and 20.x

### 2. Code Formatting (Prettier)  
- Checks code formatting consistency
- Runs on both Client and Server
- Tests on Node 18.x and 20.x

### 3. Docker Build & Test
- Builds Docker images from Dockerfile
- Starts all containers (MySQL database + Express server)
- Verifies containers run successfully
- Tests database connection
- Tests server health endpoint

---

## 📁 Workflows

```
.github/workflows/
├── code-quality.yml  ← ESLint + Prettier checks
└── docker-test.yml   ← Docker build & container tests
```

---

## 🚀 Local Commands

Run these locally before pushing:

### Lint & Format
```bash
# Client
cd Client
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format:check  # Check formatting
npm run format        # Auto-format

# Server
cd Server
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format:check  # Check formatting
npm run format        # Auto-format
```

### Docker (test locally)
```bash
cd ..
docker compose build  # Build images
docker compose up     # Start containers
docker compose down   # Stop containers
```

---

## 📊 Viewing Results

After pushing to GitHub:

1. Go to your repository on GitHub
2. Click the **Actions** tab (top navigation)
3. Find your commit in the list
4. See ✅ (passed) or ❌ (failed) for each workflow
5. Click on a workflow to see detailed logs

### Understanding the Results

**✅ Green Check** - All checks passed, code is good!  
**❌ Red X** - Something failed, needs fixing  
**🟡 Yellow Circle** - Currently running  
**⚪ Gray** - Workflow hasn't run yet

---

## 🔧 How to Fix Issues

### If Code Quality Check Fails

```bash
# Fix Client
cd Client
npm run lint:fix
npm run format
git add .

# Fix Server
cd ../Server
npm run lint:fix
npm run format
git add .

# Commit and push again
git commit -m "fix: code quality issues"
git push
```

### If Docker Build Fails

```bash
# Test locally first
docker compose build

# Check for errors
docker compose up

# View logs
docker compose logs server
docker compose logs db

# Fix the Dockerfile or docker-compose.yml
# Then commit and push
git add .
git commit -m "fix: docker configuration"
git push
```

---

## 🎯 Workflows Trigger

All workflows run on:
- ✅ Every push to **any branch**
- ✅ Every pull request

You don't need to do anything special - just push your code!

---

## 📋 Workflow Details

### code-quality.yml

**What it does:**
1. Checks out your code
2. Sets up Node.js (versions 18.x and 20.x)
3. Installs Server dependencies
4. Runs `npm run lint` on Server
5. Runs `npm run format:check` on Server
6. Installs Client dependencies
7. Runs `npm run lint` on Client
8. Runs `npm run format:check` on Client

**Takes:** ~2-3 minutes  
**Fails if:** Any lint errors or formatting issues found

### docker-test.yml

**What it does:**
1. Checks out your code
2. Sets up Docker Buildx
3. Creates temporary .env file with test secrets
4. Builds Docker images (`docker compose build`)
5. Starts containers (`docker compose up -d`)
6. Waits for database to be ready (up to 90s)
7. Waits for server to be ready (up to 90s)
8. Shows container status and logs
9. Verifies database container is running
10. Tests server `/health` endpoint
11. Verifies all containers are still up
12. Cleans up (stops containers)

**Takes:** ~3-5 minutes  
**Fails if:** Build fails, containers crash, or health check fails

---

## 💡 Pro Tips

### Before Pushing

Always run these commands locally to catch issues early:

```bash
# Quick check (from root)
cd Client && npm run lint && npm run format:check && cd ../Server && npm run lint && npm run format:check && cd ..

# Quick fix (from root)
cd Client && npm run lint:fix && npm run format && cd ../Server && npm run lint:fix && npm run format && cd ..
```

### Debugging Failed Workflows

1. Click on the failed workflow in GitHub Actions
2. Expand the failed step to see error details
3. Look for red error messages
4. Fix locally and push again

---

## 🔍 What Gets Checked

### ESLint (Code Quality)
- ✅ No unused variables
- ✅ Consistent code style
- ✅ Best practices
- ✅ No syntax errors
- ✅ React hooks rules (Client)
- ✅ Node.js best practices (Server)

### Prettier (Formatting)
- ✅ Consistent indentation (2 spaces)
- ✅ Line length (100 characters)
- ✅ Quote style (single quotes)
- ✅ Semicolons
- ✅ Trailing commas

### Docker
- ✅ Dockerfile builds successfully
- ✅ Docker Compose starts all services
- ✅ Database container runs
- ✅ Server container runs
- ✅ Server responds to health checks
- ✅ No container crashes


