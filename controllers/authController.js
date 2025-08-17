const User = require('../models/User');
const Department = require('../models/Department'); // Needed if staff registration involves selecting a department
const jwt = require('jsonwebtoken');

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