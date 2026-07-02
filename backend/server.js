const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables.');
  process.exit(1);
}

// Connect to Database
connectDB();

const app = express();

// ── Security Middlewares ──────────────────────────────────
// Helmet: sets secure HTTP headers (XSS protection, content-type sniffing, etc.)
app.use(helmet());

// CORS: restrict origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : true, // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate limit auth routes specifically ───────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// General API rate limit
app.use('/api', apiLimiter);

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/accessories', require('./routes/accessoryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Root Status
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'API is running successfully' });
});

// ── Error handling middleware ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred'
    : err.message || 'An internal server error occurred';
  res.status(500).json({ message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
