const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Department names should be unique
    trim: true,
  },
  // Optional: To track who created the department, useful for admin logs
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who is an admin
    required: true,
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
departmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for performance
departmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', departmentSchema); 