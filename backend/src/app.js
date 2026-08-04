const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const swipeRoutes = require('./routes/swipe.routes');
const friendRoutes = require('./routes/friend.routes');
const chatRoutes = require('./routes/chat.routes');
const billingRoutes = require('./routes/billing.routes');
const eventRoutes = require('./routes/event.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const geoRoutes = require('./routes/geo.routes');
const mediaRoutes = require('./routes/media.routes');
const rateLimit = require('express-rate-limit');
const AppError = require('./errors/appError');
const { recordSystemError } = require('./services/systemHealth.service');
const path = require('path');
const { corsOriginCallback } = require('./config/cors');

// 1. Global Rate Limiter (100 requests per 15 mins)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Brute-force protection for Auth routes (15 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Global Middlewares
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: corsOriginCallback,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-refresh-token']
}));
app.use(compression());

// Disable caching for all API responses to ensure fresh DB data reaches the frontend
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/campus', swipeRoutes);
app.use('/api/v1/network', friendRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/geo', geoRoutes);
app.use('/api/v1/media', mediaRoutes);

// Admin Routes
app.use('/api/v1/admin', adminRoutes);

// Fallback Route (Express 5 compatible catch-all)
app.all('*splat', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (statusCode >= 500) {
    recordSystemError(err, { url: req.originalUrl, method: req.method });
  }

  res.status(statusCode).json({
    status,
    message: err.message,
    ...(err.data || {}),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
