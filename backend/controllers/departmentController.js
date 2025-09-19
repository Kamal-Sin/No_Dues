const Department = require('../models/Department');
const User = require('../models/User');

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
    res.status(500).json({ message: 'Server error creating department' });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Authenticated users only)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).populate('createdBy', 'name email'); // Populate creator info
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching departments' });
  }
};