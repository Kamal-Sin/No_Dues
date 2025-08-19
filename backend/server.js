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
    'https://your-frontend-domain.vercel.app', // Replace with your Vercel domain
    process.env.FRONTEND_URL // Environment variable for frontend URL
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
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/requests', requestRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'No-Dues Backend API is running!',
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
