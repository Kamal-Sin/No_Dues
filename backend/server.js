// server.js (Main entry point for the backend)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // To manage environment variables

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noDuesApp';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
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

// Root endpoint
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