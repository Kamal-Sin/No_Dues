// This immersive contains the code for Step 4: No-Dues Workflow APIs.
// It assumes the structure and files from `no_dues_auth_backend` (Step 3) are in place.

// --- Ensure these lines are added/updated in server.js ---
/*
// Import routes (add these new ones)
const departmentRoutes = require('./routes/departmentRoutes');
const requestRoutes = require('./routes/requestRoutes');

// ... (other server.js code) ...

// API Routes (add these new ones)
app.use('/api/departments', departmentRoutes);
app.use('/api/requests', requestRoutes);

// ... (rest of server.js) ...
*/

// --- controllers/departmentController.js ---
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


// --- routes/departmentRoutes.js ---
const express = require('express');
const router = express.Router();
const { createDepartment, getAllDepartments } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware'); // Changed from authMiddleware to direct import
const { authorize } = require('../middleware/roleMiddleware'); // Changed from authMiddleware to direct import

// @route   POST /api/departments
// @desc    Add a new department
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createDepartment);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private (Authenticated users - e.g., admin, or staff during registration, or student creating request)
router.get('/', protect, getAllDepartments); // All authenticated users can see departments

module.exports = router;


// --- controllers/requestController.js ---
const NoDuesRequest = require('../models/NoDuesRequest');
const Department = require('../models/Department');
const User = require('../models/User'); // For populating student/staff details

// @desc    Create a new no-dues request
// @route   POST /api/requests
// @access  Private (Student only)
exports.createNoDuesRequest = async (req, res) => {
  try {
    const studentId = req.user.id; // Logged-in student's ID from 'protect' middleware

    // Check if the student already has an active (pending/in-progress) request
    const existingRequest = await NoDuesRequest.findOne({
      student: studentId,
      overallStatus: { $in: ['pending', 'in-progress'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have an active no-dues request.' });
    }

    // Fetch all departments to initialize the departmentsStatus array
    const allDepartments = await Department.find({}, '_id name');
    if (!allDepartments || allDepartments.length === 0) {
      return res.status(400).json({ message: 'No departments found in the system. Cannot create a request.' });
    }

    const initialDepartmentsStatus = allDepartments.map(dept => ({
      department: dept._id,
      status: 'pending', // Initial status for all departments
      comment: '',
    }));

    const newRequest = new NoDuesRequest({
      student: studentId,
      departmentsStatus: initialDepartmentsStatus,
      overallStatus: 'pending', // Initial overall status
    });

    // The pre-save hook in NoDuesRequest model will also set overallStatus
    // based on departmentsStatus, but here we explicitly set it to 'pending'.
    // The hook will re-evaluate if departmentsStatus is empty or all approved/rejected.

    const savedRequest = await newRequest.save();
    const populatedRequest = await NoDuesRequest.findById(savedRequest._id)
                                    .populate('student', 'name email')
                                    .populate('departmentsStatus.department', 'name');

    res.status(201).json({
        message: 'No-dues request created successfully',
        request: populatedRequest
    });

  } catch (error) {
    console.error('Create no-dues request error:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating request' });
  }
};

// @desc    Get a specific no-dues request by ID
// @route   GET /api/requests/:id
// @access  Private (Student who owns it, relevant Staff, Admin)
exports.getNoDuesRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = req.user; // From 'protect' middleware {id, role, department (if staff)}

    const request = await NoDuesRequest.findById(requestId)
      .populate('student', 'name email role')
      .populate('departmentsStatus.department', 'name') // Populate department name
      .populate('departmentsStatus.approvedBy', 'name email'); // Populate staff who approved/rejected

    if (!request) {
      return res.status(404).json({ message: 'No-dues request not found' });
    }

    // Authorization:
    // 1. Student who owns the request
    // 2. Staff member whose department is part of the request
    // 3. Admin
    let authorized = false;
    if (user.role === 'admin') {
      authorized = true;
    } else if (user.role === 'student' && request.student._id.toString() === user.id) {
      authorized = true;
    } else if (user.role === 'staff') {
      // Check if the staff's department is in the request's department list
      const staffDepartmentId = user.department; // This should be the ID from the token
      if (request.departmentsStatus.some(ds => ds.department._id.toString() === staffDepartmentId.toString())) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request by ID error:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid request ID format' });
    }
    res.status(500).json({ message: 'Server error while fetching request' });
  }
};

// @desc    Get all requests for the logged-in student
// @route   GET /api/requests/my
// @access  Private (Student only)
exports.getMyNoDuesRequests = async (req, res) => {
    try {
        const studentId = req.user.id;
        const requests = await NoDuesRequest.find({ student: studentId })
            .populate('student', 'name email')
            .populate('departmentsStatus.department', 'name')
            .sort({ createdAt: -1 }); // Show newest first

        res.json(requests);
    } catch (error) {
        console.error('Get my requests error:', error.message);
        res.status(500).json({ message: 'Server error while fetching your requests' });
    }
};


// @desc    Get pending requests for a staff member's department
// @route   GET /api/requests
// @access  Private (Staff only)
// Note: Admin might use GET /api/requests/all for a broader view
exports.getPendingRequestsForStaff = async (req, res) => {
  try {
    const staffDepartmentId = req.user.department; // Department ID of the logged-in staff from token

    if (!staffDepartmentId) {
      return res.status(400).json({ message: 'Staff department not found in your profile. Cannot fetch requests.' });
    }

    // Find requests where this staff's department has a 'pending' status.
    // Also, the overall request should not be fully 'approved' or 'rejected' yet,
    // though 'in-progress' is fine.
    const requests = await NoDuesRequest.find({
      'departmentsStatus.department': staffDepartmentId,
      'departmentsStatus.status': 'pending',
      'overallStatus': { $in: ['pending', 'in-progress'] } // Only show requests that are still active
    })
    .populate('student', 'name email') // Populate student details
    .populate({ // Populate specific department details for clarity
        path: 'departmentsStatus.department',
        select: 'name'
    })
    .sort({ createdAt: 1 }); // Oldest pending requests first

    // Filter the departmentsStatus array for each request to only show the relevant department's status
    // or show all. For now, returning full request object. Client can filter if needed.

    res.json(requests);
  } catch (error) {
    console.error('Get pending requests for staff error:', error.message);
    res.status(500).json({ message: 'Server error while fetching pending requests' });
  }
};

// @desc    Staff approve/reject a no-dues request for their department
// @route   PUT /api/requests/:id/action
// @access  Private (Staff only)
exports.updateDepartmentApproval = async (req, res) => {
  const requestId = req.params.id;
  const { status, comment } = req.body; // status: 'approved' or 'rejected'
  const staffUser = req.user; // {id, role, department (ID)}

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
  }
  if (status === 'rejected' && (!comment || comment.trim() === '')) {
    return res.status(400).json({ message: 'Comment is required when rejecting a request.' });
  }

  try {
    const request = await NoDuesRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'No-dues request not found' });
    }

    if (request.overallStatus === 'approved' || request.overallStatus === 'rejected') {
        return res.status(400).json({ message: `Request is already finalized with status: ${request.overallStatus}. No further actions allowed.` });
    }

    const staffDepartmentId = staffUser.department;
    if (!staffDepartmentId) {
        return res.status(403).json({ message: 'Your user profile is not associated with a department.' });
    }

    // Find the specific department status entry to update
    const departmentStatusIndex = request.departmentsStatus.findIndex(
      ds => ds.department.toString() === staffDepartmentId.toString()
    );

    if (departmentStatusIndex === -1) {
      return res.status(403).json({ message: 'Your department is not part of this no-dues request, or it was not found.' });
    }

    // Check if this department has already acted
    if (request.departmentsStatus[departmentStatusIndex].status !== 'pending') {
        return res.status(400).json({ message: `Your department has already processed this request with status: ${request.departmentsStatus[departmentStatusIndex].status}.` });
    }


    // Update the specific department's status
    request.departmentsStatus[departmentStatusIndex].status = status;
    request.departmentsStatus[departmentStatusIndex].comment = comment || '';
    request.departmentsStatus[departmentStatusIndex].approvedBy = staffUser.id;
    request.departmentsStatus[departmentStatusIndex].timestamp = Date.now();

    // The pre-save hook in NoDuesRequest model will update overallStatus
    await request.save();

    const populatedRequest = await NoDuesRequest.findById(request._id)
                                    .populate('student', 'name email')
                                    .populate('departmentsStatus.department', 'name')
                                    .populate('departmentsStatus.approvedBy', 'name email');

    res.json({
        message: `Request ${status} successfully for your department.`,
        request: populatedRequest
    });

  } catch (error) {
    console.error('Update department approval error:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid request ID format' });
    }
    res.status(500).json({ message: 'Server error while updating request status' });
  }
};

// @desc    Get all no-dues requests (for Admin)
// @route   GET /api/requests/all
// @access  Private (Admin only)
exports.getAllNoDuesRequests = async (req, res) => {
  try {
    // Add query parameters for filtering (e.g., by status, department, student) if needed in future
    // For now, gets all requests
    const { status, studentName, departmentName } = req.query;
    let query = {};

    if (status) {
        query.overallStatus = status;
    }

    if (studentName) {
        // Find student IDs matching the name
        const students = await User.find({ name: new RegExp(studentName, 'i'), role: 'student' }, '_id');
        if (students.length > 0) {
            query.student = { $in: students.map(s => s._id) };
        } else {
            // No students match, so no requests will match
            return res.json([]);
        }
    }

    // Filtering by departmentName is more complex as it's in a nested array.
    // For simplicity, this example won't implement deep department name filtering on the backend here.
    // Client-side filtering or more advanced MongoDB aggregation could be used.

    const requests = await NoDuesRequest.find(query)
      .populate('student', 'name email role') // Populate student details
      .populate({ // Populate department details within the array
          path: 'departmentsStatus.department',
          select: 'name' // Select only the name of the department
      })
      .populate({ // Populate staff who approved/rejected
          path: 'departmentsStatus.approvedBy',
          select: 'name email'
      })
      .sort({ createdAt: -1 }); // Show newest first

    res.json(requests);
  } catch (error) {
    console.error('Get all requests (admin) error:', error.message);
    res.status(500).json({ message: 'Server error while fetching all requests' });
  }
};


// --- routes/requestRoutes.js ---
const express = require('express');
const router = express.Router();
const {
  createNoDuesRequest,
  getNoDuesRequestById,
  getMyNoDuesRequests,
  getPendingRequestsForStaff,
  updateDepartmentApproval,
  getAllNoDuesRequests
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

// Common route for student, staff (relevant dept), admin
// GET /api/requests/:id - Get a specific request by ID
router.get('/:id', protect, getNoDuesRequestById); // Authorization handled within controller

module.exports = router;



This immersive document (no_dues_workflow_apis) includes:

controllers/departmentController.js:

createDepartment: Allows an admin to add a new department.
getAllDepartments: Allows any authenticated user to fetch a list of all departments.
routes/departmentRoutes.js:

POST /api/departments: Protected for 'admin' role.
GET /api/departments: Protected for any authenticated user.
controllers/requestController.js:

createNoDuesRequest: For students to submit a new no-dues request. It automatically populates departmentsStatus with all existing departments set to 'pending'.
getNoDuesRequestById: For a student to view their own request, for staff of a relevant department to view it, or for an admin to view any request. Authorization logic is handled within the controller.
getMyNoDuesRequests: For a student to get a list of all their past and present requests.
getPendingRequestsForStaff: For staff to get requests pending approval in their specific department.
updateDepartmentApproval: For staff to approve or reject a request for their department. It updates the specific department's status within the departmentsStatus array and relies on the NoDuesRequest model's pre-save hook to update the overallStatus.
getAllNoDuesRequests: For admins to view all no-dues requests in the system, with basic filtering examples.
routes/requestRoutes.js: Defines routes for all no-dues request operations, applying protect and authorize middleware as appropriate for student, staff, and admin roles.

To integrate this into your existing backend:

Create the new files: controllers/departmentController.js, routes/departmentRoutes.js, controllers/requestController.js, and routes/requestRoutes.js.
Copy the code from this immersive into the respective files.
Update server.js:
Import the new route files:
const departmentRoutes = require('./routes/departmentRoutes');
const requestRoutes = require('./routes/requestRoutes');
Mount these routes:
app.use('/api/departments', departmentRoutes);
app.use('/api/requests', requestRoutes);
Ensure all models (User.js, Department.js, NoDuesRequest.js from no_dues_db_schema) are correctly placed in the models folder and that User.js includes the bcrypt password hashing logic. The NoDuesRequest.js model should also have its pre-save hook for overallStatus and updatedAt.
With these APIs in place, the backend can now handle the main workflows of the no-dues application.