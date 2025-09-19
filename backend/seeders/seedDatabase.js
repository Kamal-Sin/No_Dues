const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noDuesApp';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - be careful in production!)
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create departments
    const departments = [
      { name: 'Computer Science' },
      { name: 'Electronics & Communication' },
      { name: 'Mechanical Engineering' },
      { name: 'Civil Engineering' },
      { name: 'Electrical Engineering' },
      { name: 'Information Technology' },
      { name: 'Library' },
      { name: 'Accounts' },
      { name: 'Hostel' },
      { name: 'Sports' }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('✅ Created departments');

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: 'admin0',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Created admin user');

    // Create staff user
    const staffUser = new User({
      name: 'Staff Member',
      email: 'staff@gmail.com',
      password: 'staff0',
      role: 'staff',
      department: createdDepartments[0]._id // Assign to first department (Computer Science)
    });
    await staffUser.save();
    console.log('✅ Created staff user');

    // Create student user
    const studentUser = new User({
      name: 'Student User',
      email: 'student@gmail.com',
      password: 'student',
      role: 'student'
    });
    await studentUser.save();
    console.log('✅ Created student user');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@gmail.com / admin0');
    console.log('Staff: staff@gmail.com / staff0');
    console.log('Student: student@gmail.com / student');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
