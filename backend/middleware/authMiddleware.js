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