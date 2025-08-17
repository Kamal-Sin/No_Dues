// This immersive contains the code for Step 5: Generate No-Dues PDF.
// It builds upon the existing backend structure from previous steps.

// --- Add this to controllers/requestController.js ---
// At the top of the file, require pdfkit:
// const PDFDocument = require('pdfkit');
// const fs = require('fs'); // Only if saving to file system first, not needed for direct streaming

/*
Make sure to install pdfkit: npm install pdfkit
Add the following function to your existing `controllers/requestController.js`
*/

const PDFDocument = require('pdfkit');
// const NoDuesRequest = require('../models/NoDuesRequest'); // Already imported
// const User = require('../models/User'); // Already imported
// const Department = require('../models/Department'); // Already imported

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
    } else if (user.role === 'student' && request.student._id.toString() === user.id && request.overallStatus === 'approved') {
      authorized = true;
    } else if (user.role === 'student' && request.student._id.toString() === user.id && request.overallStatus !== 'approved') {
      return res.status(403).json({ message: 'Your no-dues request is not yet fully approved. PDF cannot be generated.' });
    }


    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to download this PDF.' });
    }

    // Ensure the request is actually approved before generating PDF
    if (request.overallStatus !== 'approved') {
      return res.status(400).json({ message: 'No-dues request is not yet fully approved. PDF cannot be generated.' });
    }

    // Create a new PDFDocument
    const doc = new PDFDocument({ margin: 50 });

    // --- Set up HTTP headers for PDF download ---
    const studentNameSanitized = request.student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `No_Dues_Certificate_${studentNameSanitized}_${request._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF output directly to the HTTP response
    doc.pipe(res);

    // --- Add content to the PDF ---

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('NO-DUES CERTIFICATE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text('XYZ University', { align: 'center' }); // Replace with actual university name
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
         .strokeColor('# Ελλάς') // light gray lines
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
    console.error('PDF Generation Error:', error.message);
    // Check if headers already sent, which can happen if PDF streaming started.
    if (!res.headersSent) {
      if (error.kind === 'ObjectId') {
          return res.status(400).json({ message: 'Invalid request ID format for PDF generation' });
      }
      res.status(500).json({ message: 'Server error during PDF generation.' });
    } else {
      // If headers are sent, the PDF stream might be corrupted.
      // Ending the response is important.
      console.error('Error occurred after PDF stream started. Response may be incomplete.');
      res.end();
    }
  }
};


// --- Add this route to routes/requestRoutes.js ---
/*
Inside your `routes/requestRoutes.js`, add the following:

// Import the new controller function
const {
  // ... other imported functions
  generateNoDuesPdf // Add this
} = require('../controllers/requestController');

// ... (other routes) ...

// @route   GET /api/requests/:id/pdf
// @desc    Generate and download a No-Dues PDF for an approved request
// @access  Private (Student who owns it if approved, Admin)
router.get('/:id/pdf', protect, generateNoDuesPdf); // Authorization handled within controller

*/
Okay, let's tackle Step 5: Generate No-Dues PDF.

We'll use the pdfkit library for its simplicity in generating PDF documents directly in Node.js. It's well-suited for creating documents with text, basic layouts, and images if needed (though we'll stick to text for now).

First, you'll need to install pdfkit:
npm install pdfkit

I'll add a new controller function to requestController.js and a corresponding route in requestRoutes.js. This endpoint will allow a student (once their request is fully approved) or an admin to download the No-Dues certificate as a PDF.
No-Dues App: PDF Generation (pdfkit)
3 Jun, 16:12

Open

Key changes and explanations:

Installation: Make sure pdfkit is installed (npm install pdfkit).
controllers/requestController.js:
A new function generateNoDuesPdf is added.
It fetches the request and performs authorization checks:
Only the student who owns the request can download it, and only if overallStatus is 'approved'.
Admins can download any PDF.
It sets HTTP headers to tell the browser to download the file as a PDF.
It uses pdfkit to:
Create a new document.
Pipe the output directly to the res object (streaming the PDF to the client).
Add a title, university name (placeholder), student details, and the date of final approval.
Iterate through departmentsStatus to list each department, its approval status (which should all be 'approved' at this stage), the staff member who approved it, and the timestamp. Comments are also included.
Adds a footer note.
Calls doc.end() to finalize the PDF.
Includes error handling, especially considering that PDF streaming might have started before an error occurs.
routes/requestRoutes.js:
A new route GET /api/requests/:id/pdf is added.
It's protected by the protect middleware. The specific authorization (student owner of approved request or admin) is handled within the generateNoDuesPdf controller function.
To integrate:

Install pdfkit: npm install pdfkit.
Add the generateNoDuesPdf function to your controllers/requestController.js file. Remember to require('pdfkit') at the top.
Add the new route GET /api/requests/:id/pdf to your routes/requestRoutes.js file, ensuring you import generateNoDuesPdf from the controller.
Now, when a student's no-dues request is fully approved, they (or an admin) can hit this endpoint to get their No-Dues Certificate as a PDF.