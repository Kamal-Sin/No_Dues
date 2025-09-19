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
// @access  Private (authenticated users only)
router.get('/', protect, getAllDepartments);

module.exports = router;