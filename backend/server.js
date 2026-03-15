// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './src/config/db.js';        // fixed named import
import errorHandler from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import financeRoutes from './src/routes/finance.routes.js';
import leaseRoutes from './src/routes/lease.routes.js';
import unitRoutes from './src/routes/unit.routes.js';
import propertyRoutes from './src/routes/property.routes.js';
import maintenanceRoutes from './src/routes/maintenanceRoutes.js';
import { applyHelmet, rateLimiter } from './src/middleware/security.js';

const app = express();
app.set('trust proxy', 1);

const configuredOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
const defaultOrigins = process.env.NODE_ENV === 'production'
  ? 'https://rentalapp2.vercel.app'
  : 'http://localhost:5173,http://localhost:5174,https://rentalapp2.vercel.app';

function normalizeOrigin(value) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '');
}

const allowedOrigins = (configuredOrigins || defaultOrigins)
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin);
}

// CORS – allow your Vite dev origin
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin || '[no-origin]');
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Global security middleware
app.use(applyHelmet);
app.use(rateLimiter);

// Common middleware
app.use(express.json());

// DB
// Health
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rental API is running',
    health: '/health',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test-helmet', (req, res) => {
  res.send('helmet headers test');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Error handler after routes
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('CORS allowed origins:', allowedOrigins.join(', '));

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
