const express = require('express');
const router = express.Router();
const { createDepartment, getAllDepartments } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @route   POST /api/departments
// @desc    Add a new department
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createDepartment);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public (needed for staff registration)
router.get('/', getAllDepartments); // All users can see departments

module.exports = router; 