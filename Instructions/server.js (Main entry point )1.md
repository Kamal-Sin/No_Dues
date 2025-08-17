// server.js (Main entry point for the backend)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // To manage environment variables

// Import routes
const authRoutes = require('./routes/authRoutes');
// We will create these later
// const departmentRoutes = require('./routes/departmentRoutes');
// const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noDuesApp'; // Replace with your MongoDB connection string

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('No-Dues Application Backend is running!');
});

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/departments', departmentRoutes); // To be added in Step 4
// app.use('/api/requests', requestRoutes);       // To be added in Step 4


// Global error handler (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// --- Directory Structure ---
// .
// ├── server.js
// ├── .env
// ├── package.json
// ├── config/
// │   └── jwt.js  (or store secret directly in .env)
// ├── controllers/
// │   └── authController.js
// ├── middleware/
// │   ├── authMiddleware.js
// │   └── roleMiddleware.js
// ├── models/
// │   ├── User.js         (From Step 2)
// │   ├── Department.js   (From Step 2)
// │   └── NoDuesRequest.js(From Step 2)
// └── routes/
//     └── authRoutes.js

// --- .env file (Create this file in the root directory) ---
// MONGODB_URI=mongodb://localhost:27017/noDuesApp
// JWT_SECRET=your_super_secret_jwt_key_here_please_change_me
// PORT=5000

// --- config/jwt.js (Optional, if you don't want to put JWT_SECRET directly in .env or want more config) ---
// module.exports = {
//   secret: process.env.JWT_SECRET || 'fallback_secret_key',
//   expiresIn: '1h' // Token expiration time
// };

// --- models/User.js, models/Department.js, models/NoDuesRequest.js ---
// These files are as defined in the `no_dues_db_schema` immersive.
// Make sure to include the bcrypt password hashing middleware in User.js.

// Add this to models/User.js before module.exports:
/*
const bcrypt = require('bcryptjs');

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
*/

// --- controllers/authController.js ---
const User = require('../models/User');
const Department = require('../models/Department'); // Needed if staff registration involves selecting a department
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Already handled by pre-save hook in User model

// JWT Secret - ensure this is in your .env file
const JWT_SECRET = process.env.JWT_SECRET;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, role, departmentName } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate input
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }
    if (!['student', 'staff', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    let departmentId = null;
    if (role === 'staff') {
      if (!departmentName) {
        return res.status(400).json({ message: 'Department name is required for staff role' });
      }
      const department = await Department.findOne({ name: departmentName });
      if (!department) {
        // Optionally, allow admin to create department on the fly or restrict staff registration
        // For now, assume department must exist.
        return res.status(400).json({ message: `Department '${departmentName}' not found. Staff cannot be registered without a valid department.` });
      }
      departmentId = department._id;
    }

    // Create new user instance (password will be hashed by pre-save hook in User model)
    user = new User({
      name,
      email,
      password,
      role,
      department: departmentId, // Assign department ObjectId if role is staff
    });

    await user.save();

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        department: user.department // Include department for staff if needed for frontend logic
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5h' }, // Token expiration
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error.message);
    // Check for Mongoose validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email }).populate('department', 'name'); // Populate department name for staff
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }

    // Validate password (using method defined in User model)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password mismatch)' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        // Include department ID and name if user is staff
        department: user.role === 'staff' && user.department ? { id: user.department._id, name: user.department.name } : undefined
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5h' }, // Token expiration: 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.role === 'staff' && user.department ? { id: user.department._id, name: user.department.name } : undefined
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get logged in user details
// @route   GET /api/auth/me
// @access  Private (requires token)
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the authMiddleware
    const user = await User.findById(req.user.id).select('-password').populate('department', 'name');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department // This will be populated with name if staff
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// --- routes/authRoutes.js ---
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // We'll create this next

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Private
router.get('/me', protect, getMe); // Example of a protected route

module.exports = router;


// --- middleware/authMiddleware.js ---
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // To potentially check if user still exists or is not disabled
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Get token from "Bearer <token>"

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Add user from payload to request object
      // Optionally, fetch user from DB to ensure they exist and are active
      // req.user = await User.findById(decoded.user.id).select('-password');
      // if (!req.user) {
      //   return res.status(401).json({ message: 'Not authorized, user not found' });
      // }
      req.user = decoded.user; // Contains { id: '...', role: '...' }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification error:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, token failed (invalid signature)' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};


// --- middleware/roleMiddleware.js ---
// This middleware checks if the authenticated user has the required role(s).
// It should be used *after* the `protect` middleware.

exports.authorize = (...roles) => { // Takes an array of allowed roles
  return (req, res, next) => {
    // req.user should be populated by the `protect` middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'User role not found in token. Authorization denied.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}.`,
      });
    }
    next(); // User has one of the required roles, proceed
  };
};

// Example usage in a route file (e.g., routes/departmentRoutes.js - to be created later):
/*
const express = require('express');
const router = express.Router();
const { createDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Assuming authorize is also in authMiddleware or roleMiddleware.js

// Only admin can create departments
router.post('/', protect, authorize('admin'), createDepartment);

module.exports = router;
*/

```

This immersive provides the foundational backend code for:

1.  **`server.js`**: Main application entry point, Express setup, MongoDB connection, and route mounting.
2.  **`.env` (example)**: For environment variables like `MONGODB_URI` and `JWT_SECRET`. **Remember to create this file and use a strong, unique `JWT_SECRET`**.
3.  **`models/User.js` (modification)**: Added `bcryptjs` for password hashing before saving and a method to compare passwords during login.
4.  **`controllers/authController.js`**:
    * `registerUser`: Handles new user registration. It checks for existing users, validates input, hashes the password (via the User model's pre-save hook), assigns a department if the role is 'staff' (assuming department exists), saves the user, and returns a JWT.
    * `loginUser`: Handles user login. It finds the user by email, validates the password, and returns a JWT.
    * `getMe`: A protected route example to fetch the currently logged-in user's details (excluding password).
5.  **`routes/authRoutes.js`**: Defines the `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` endpoints.
6.  **`middleware/authMiddleware.js`**:
    * `protect`: A middleware to verify the JWT sent in the `Authorization` header. If valid, it attaches the user's payload (e.g., `id`, `role`) to the `req` object.
7.  **`middleware/roleMiddleware.js`**:
    * `authorize`: A higher-order function that returns a middleware. This middleware checks if the `req.user.role` (set by `protect`) is included in the list of allowed roles for a specific route.

**To make this runnable, you would need to:**

1.  Create the directory structure as commented in `server.js`.
2.  Place the Mongoose models (`User.js`, `Department.js`, `NoDuesRequest.js`) from `no_dues_db_schema` into the `models/` directory. **Crucially, update `User.js` to include the `bcryptjs` hashing logic as shown in the comments within the code block above.**
3.  Install dependencies: `npm install express mongoose cors dotenv jsonwebtoken bcryptjs`
4.  Create a `.env` file in the root of your project with your `MONGODB_URI` and a secure `JWT_SECRET`.
5.  Run the server: `node server.js` or `nodemon server.js` if you have nodemon installed.

We now have the core authentication and authorization mechanisms in place. Next, in Step 4, we'll build the API routes for the no-dues workflow itself, utilizing these authentication and role-based access control middlewares.
