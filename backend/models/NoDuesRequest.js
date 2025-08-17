const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const approvalSchema = new Schema({
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true,
  },
  comment: {
    type: String,
    trim: true,
    default: '',
  },
  approvedBy: { // Staff member who approved/rejected
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  timestamp: { // When the approval/rejection was made
    type: Date,
  },
}, {_id: false}); // _id is not needed for subdocuments here if not queried directly

const noDuesRequestSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the student User
    required: true,
  },
  departmentsStatus: [approvalSchema], // Array of approval statuses from each department
  overallStatus: {
    type: String,
    enum: ['pending', 'in-progress', 'approved', 'rejected'],
    default: 'pending', // Overall status of the no-dues request
    required: true,
  },
  // To be filled when all departments have approved
  finalApprovalDate: {
    type: Date,
  },
  // Potentially store a reference to the generated PDF, e.g., its path or ID
  pdfReference: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field before saving
noDuesRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Logic to update overallStatus based on departmentsStatus can be added here
  // or in the application layer before saving.
  // For example:
  const allApproved = this.departmentsStatus.every(dept => dept.status === 'approved');
  const anyRejected = this.departmentsStatus.some(dept => dept.status === 'rejected');

  if (anyRejected) {
    this.overallStatus = 'rejected';
  } else if (allApproved && this.departmentsStatus.length > 0) { // Ensure departmentsStatus is populated
    this.overallStatus = 'approved';
    if (!this.finalApprovalDate) { // Set final approval date only once
        this.finalApprovalDate = Date.now();
    }
  } else if (this.departmentsStatus.some(dept => dept.status === 'approved' || dept.status === 'rejected')) {
    this.overallStatus = 'in-progress';
  } else {
    this.overallStatus = 'pending';
  }

  next();
});

// Indexes for performance
noDuesRequestSchema.index({ student: 1 });
noDuesRequestSchema.index({ "departmentsStatus.department": 1 });
noDuesRequestSchema.index({ overallStatus: 1 });

module.exports = mongoose.model('NoDuesRequest', noDuesRequestSchema); 