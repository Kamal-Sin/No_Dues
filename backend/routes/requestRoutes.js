const express = require('express');
const router = express.Router();
const {
  createNoDuesRequest,
  getNoDuesRequestById,
  getMyNoDuesRequests,
  getPendingRequestsForStaff,
  updateDepartmentApproval,
  getAllNoDuesRequests,
  generateNoDuesPdf
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Student routes
router.post('/', protect, authorize('student'), createNoDuesRequest); // Create a new request
router.get('/my', protect, authorize('student'), getMyNoDuesRequests); // Get all requests for logged-in student

// Staff routes
// GET /api/requests (for staff) - lists pending requests for their department
router.get('/', protect, authorize('staff'), getPendingRequestsForStaff);
// PUT /api/requests/:id/action (for staff) - approve/reject a request for their department
router.put('/:id/action', protect, authorize('staff'), updateDepartmentApproval);

// Admin routes
// GET /api/requests/all (for admin) - lists all requests in the system
router.get('/all', protect, authorize('admin'), getAllNoDuesRequests);

// PDF generation route (must come before /:id route to avoid conflict)
// GET /api/requests/:id/pdf - Generate and download a No-Dues PDF for an approved request
router.get('/:id/pdf', protect, generateNoDuesPdf); // Authorization handled within controller

// Common route for student, staff (relevant dept), admin
// GET /api/requests/:id - Get a specific request by ID
router.get('/:id', protect, getNoDuesRequestById); // Authorization handled within controller

module.exports = router; 