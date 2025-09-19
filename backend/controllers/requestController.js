const NoDuesRequest = require('../models/NoDuesRequest');
const Department = require('../models/Department');
const User = require('../models/User'); // For populating student/staff details
const PDFDocument = require('pdfkit');

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

    const savedRequest = await newRequest.save();
    const populatedRequest = await NoDuesRequest.findById(savedRequest._id)
                                    .populate('student', 'name email')
                                    .populate('departmentsStatus.department', 'name');

    res.status(201).json({
        message: 'No-dues request created successfully',
        request: populatedRequest
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error creating request' });
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
    res.status(500).json({ message: 'Server error fetching request' });
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
        res.status(500).json({ message: 'Server error fetching requests' });
    }
};

// @desc    Get all requests for a staff member's department (regardless of status)
// @route   GET /api/requests
// @access  Private (Staff only)
// Note: Admin might use GET /api/requests/all for a broader view
exports.getPendingRequestsForStaff = async (req, res) => {
  try {
    // Get department ID from user object (it's an ObjectId)
    const staffDepartmentId = req.user.department;

    if (!staffDepartmentId) {
      return res.status(400).json({ message: 'Staff department not found in your profile. Cannot fetch requests.' });
    }

    // Find all requests where this staff's department is involved
    // Show all requests regardless of status so staff can see the current state
    const requests = await NoDuesRequest.find({
      'departmentsStatus.department': staffDepartmentId
    })
    .populate('student', 'name email') // Populate student details
    .populate({ // Populate specific department details for clarity
        path: 'departmentsStatus.department',
        select: 'name'
    })
    .sort({ createdAt: -1 }); // Show newest requests first

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching pending requests' });
  }
};

// @desc    Staff approve/reject a no-dues request for their department
// @route   PUT /api/requests/:id/action
// @access  Private (Staff only)
exports.updateDepartmentApproval = async (req, res) => {
  const requestId = req.params.id;
  const { status, comment } = req.body; // status: 'approved' or 'rejected'
  const staffUser = req.user; // {id, role, department (ID or object)}

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

    // Get department ID from user object (it's an ObjectId)
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
    res.status(500).json({ message: 'Server error updating approval' });
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
    res.status(500).json({ message: 'Server error fetching all requests' });
  }
};

// @desc    Generate and download a No-Dues PDF for an approved request
// @route   GET /api/requests/:id/pdf
// @access  Private (Student who owns it if approved, Admin)
exports.generateNoDuesPdf = async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = req.user; // From 'protect' middleware

    const request = await NoDuesRequest.findById(requestId)
      .populate('student', 'name email')
      .populate('departmentsStatus.department', 'name')
      .populate('departmentsStatus.approvedBy', 'name'); // Staff name for approval

    if (!request) {
      return res.status(404).json({ message: 'No-dues request not found' });
    }


    // Authorization:
    // 1. Student who owns the request, ONLY if it's approved.
    // 2. Admin can download any PDF.
    let authorized = false;
    if (user.role === 'admin') {
      authorized = true;
    } else if (user.role === 'student') {
      // Compare IDs properly - both should be strings after conversion
      const studentId = request.student._id.toString();
      const userId = user.id.toString();
      
      
      if (studentId === userId) {
        if (request.overallStatus === 'approved') {
          authorized = true;
        } else {
          return res.status(403).json({ 
            message: `Your no-dues request is ${request.overallStatus}. PDF can only be generated for approved requests.` 
          });
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ 
        message: 'Not authorized to download this PDF. Only the student who owns the request or an admin can download the PDF.' 
      });
    }

    // Create a new PDFDocument
    const doc = new PDFDocument({ margin: 50 });

    // --- Set up HTTP headers for PDF download ---
    const studentNameSanitized = request.student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `No_Dues_Certificate_${studentNameSanitized}_${request._id}.pdf`;
    
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', 'https://no-dues-frontend-biws.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Set PDF-specific headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF output directly to the HTTP response
    doc.pipe(res);

    // --- Add content to the PDF ---

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('NO-DUES CERTIFICATE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text('Graphic Era University', { align: 'center' }); // Changed from XYZ University
    doc.moveDown(2);

    // Student Information
    doc.fontSize(12).font('Helvetica-Bold').text('Student Details:', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(`Name: ${request.student.name}`);
    doc.text(`Email: ${request.student.email}`);
    doc.text(`Request ID: ${request._id}`);
    doc.text(`Date of Submission: ${new Date(request.createdAt).toLocaleDateString()}`);
    if (request.finalApprovalDate) {
      doc.text(`Date of Final Approval: ${new Date(request.finalApprovalDate).toLocaleDateString()}`);
    }
    doc.moveDown(1.5);

    // Department Approvals Table
    doc.fontSize(12).font('Helvetica-Bold').text('Department Clearances:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50; // doc.x is also 50 due to margin
    const departmentX = itemX;
    const statusX = 200;
    const approverX = 300;
    const dateX = 420;
    const commentX = itemX; // For comments, start on new line under department

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Department', departmentX, tableTop);
    doc.text('Status', statusX, tableTop);
    doc.text('Approved By', approverX, tableTop);
    doc.text('Date', dateX, tableTop);
    doc.moveDown(1);
    const headerBottomY = doc.y;
    doc.lineCap('butt')
       .moveTo(itemX, headerBottomY - 5)
       .lineTo(doc.page.width - itemX, headerBottomY - 5) // Use doc.page.width for full line
       .stroke();
    doc.moveDown(0.5);

    // Table Rows
    doc.font('Helvetica');
    request.departmentsStatus.forEach(deptStatus => {
      let currentY = doc.y;
      if (currentY > doc.page.height - 150) { // Check for page break before drawing row
          doc.addPage();
          currentY = doc.y; // Reset Y after page break (should be top margin)
          // Redraw header on new page if desired, or ensure content flows naturally
      }

      doc.text(deptStatus.department.name, departmentX, currentY, { width: (statusX - departmentX - 10) });
      doc.text(deptStatus.status, statusX, currentY, { width: (approverX - statusX - 10) });
      doc.text(deptStatus.approvedBy ? deptStatus.approvedBy.name : 'N/A', approverX, currentY, { width: (dateX - approverX - 10) });
      doc.text(deptStatus.timestamp ? new Date(deptStatus.timestamp).toLocaleDateString() : 'N/A', dateX, currentY);
      doc.moveDown(0.5); // Space before comment

      if (deptStatus.comment && deptStatus.comment.trim() !== '') {
        doc.fontSize(10).fillColor('grey');
        doc.text(`Comment: ${deptStatus.comment}`, commentX + 10, doc.y, { width: doc.page.width - itemX * 2 - 10 });
        doc.fillColor('black').fontSize(12); // Reset color and size
        doc.moveDown(0.75);
      } else {
        doc.moveDown(0.25); // Smaller space if no comment
      }
      const rowBottomY = doc.y;
       doc.lineCap('butt')
         .moveTo(itemX, rowBottomY - 5)
         .lineTo(doc.page.width - itemX, rowBottomY - 5)
         .strokeColor('#cccccc') // light gray lines
         .stroke();
       doc.moveDown(0.5);
    });
    doc.strokeColor('black'); // Reset stroke color

    doc.moveDown(2);

    // Footer / Declaration
    doc.fontSize(10).font('Helvetica-Oblique')
       .text('This is a system-generated document and is valid without a physical signature if all departments have approved.',
             50, doc.page.height - 100, // Position near bottom
             { align: 'center', width: doc.page.width - 100 });

    doc.text(`Generated on: ${new Date().toLocaleString()}`,
             50, doc.page.height - 70,
             { align: 'center', width: doc.page.width - 100 });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    res.status(500).json({ message: 'Server error generating PDF' });
  }
}; 