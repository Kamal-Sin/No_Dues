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
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Created admin user');

    // Create staff users for each department
    const staffUsers = [];
    for (let i = 0; i < createdDepartments.length; i++) {
      const dept = createdDepartments[i];
      const staffUser = new User({
        name: `${dept.name} Staff`,
        email: `staff${i + 1}@demo.com`,
        password: 'password123',
        role: 'staff',
        department: dept._id
      });
      staffUsers.push(staffUser);
    }
    await User.insertMany(staffUsers);
    console.log('✅ Created staff users');

    // Create sample students
    const studentUsers = [];
    for (let i = 1; i <= 5; i++) {
      const student = new User({
        name: `Student ${i}`,
        email: `student${i}@demo.com`,
        password: 'password123',
        role: 'student'
      });
      studentUsers.push(student);
    }
    await User.insertMany(studentUsers);
    console.log('✅ Created student users');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@demo.com / password123');
    console.log('Staff: staff1@demo.com to staff10@demo.com / password123');
    console.log('Students: student1@demo.com to student5@demo.com / password123');

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
