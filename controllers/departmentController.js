const Department = require('../models/Department');
const User = require('../models/User'); // To validate admin role if needed here

// @desc    Add a new department
// @route   POST /api/departments
// @access  Private (Admin only)
exports.createDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ message: `Department '${name}' already exists` });
    }

    // req.user.id is available from the 'protect' middleware
    const newDepartment = new Department({
      name,
      createdBy: req.user.id, // Logged-in admin user's ID
    });

    const savedDepartment = await newDepartment.save();
    res.status(201).json({
        message: 'Department created successfully',
        department: savedDepartment
    });
  } catch (error) {
    console.error('Create department error:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating department' });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Authenticated users - useful for admin, staff registration, student form population)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).populate('createdBy', 'name email'); // Populate creator info
    res.json(departments);
  } catch (error) {
    console.error('Get all departments error:', error.message);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
}; 