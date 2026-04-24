require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const resourcesRoutes = require('./routes/resources');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const therapistRoutes = require('./routes/therapist');

// Fail fast if JWT_SECRET is missing or too short (prevents accidental weak secrets)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET must be set and at least 32 characters long.');
  }
}

const app = express();

// Security headers
app.use(helmet());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes — auth routes get the stricter limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapist', therapistRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  // Preserve HTTP status codes from middleware errors (e.g. 413 PayloadTooLarge)
  const status = err.status || err.statusCode || 500;
  const message =
    status === 413
      ? 'Request body too large.'
      : status < 500
        ? err.message || 'Bad request.'
        : 'Internal server error';
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ error: message });
});

module.exports = app;
