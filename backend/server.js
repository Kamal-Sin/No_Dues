// backend/server.js (Main entry point for the backend)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config(); // To manage environment variables

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Log the port being used
console.log(`Starting server on port: ${PORT}`);

// Security middleware
app.use(helmet());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration for separate frontend deployment
const corsOptions = {
  origin: [
    'http://localhost:3000', // Local development
    process.env.FRONTEND_URL, // Environment variable for frontend URL
    /\.vercel\.app$/, // Allow all Vercel domains
    /\.railway\.app$/ // Allow all Railway domains
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noDuesApp';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    const { host, name, port } = mongoose.connection;
    console.log(`MongoDB connection details -> host: ${host}, port: ${port}, db: ${name}`);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't exit the process, let the server start even if DB fails
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/requests', requestRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'OK',
      message: 'No-Dues Backend API is running!',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      port: PORT
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Simple health check (no DB dependency)
app.get('/ping', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint for development
app.get('/', (req, res) => {
  res.json({
    message: 'No-Dues Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      departments: '/api/departments',
      requests: '/api/requests',
      health: '/health'
    }
  });
});

// Global error handler (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Ping endpoint: http://localhost:${PORT}/ping`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Handle uncaught exceptions (less aggressive for Railway)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, let Railway handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, let Railway handle it
});
