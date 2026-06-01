import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function seedHierarchy() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create Admin
    const admin = await User.create({
      employeeId: 'ADM001',
      name: 'System Admin',
      email: 'admin@company.com',
      password: 'password123', // In a real scenario, this should be hashed
      role: 'admin',
      department: 'Management',
      designation: 'CEO',
      joiningDate: new Date(),
      monthlySalary: 100000,
      reportsTo: null
    });
    console.log('Created Admin:', admin.name);

    // Create Finance Head
    const financeHead = await User.create({
      employeeId: 'FIN001',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      password: 'password123',
      role: 'department_head',
      department: 'Finance',
      designation: 'Finance Head',
      joiningDate: new Date(),
      monthlySalary: 80000,
      reportsTo: admin._id
    });
    console.log('Created Finance Head:', financeHead.name);

    // Create Technical Head
    const techHead = await User.create({
      employeeId: 'TECH001',
      name: 'Michael Chen',
      email: 'michael.c@company.com',
      password: 'password123',
      role: 'department_head',
      department: 'Engineering',
      designation: 'CTO',
      joiningDate: new Date(),
      monthlySalary: 90000,
      reportsTo: admin._id
    });
    console.log('Created Tech Head:', techHead.name);

    // Create Finance Employees
    for (let i = 1; i <= 5; i++) {
      await User.create({
        employeeId: `FIN00${i + 1}`,
        name: `Finance Emp ${i}`,
        email: `fin.emp${i}@company.com`,
        password: 'password123',
        role: 'employee',
        department: 'Finance',
        designation: 'Accountant',
        joiningDate: new Date(),
        monthlySalary: 50000,
        reportsTo: financeHead._id
      });
    }
    console.log('Created 5 Finance Employees');

    // Create Tech Managers
    const techManager1 = await User.create({
      employeeId: 'TECH002',
      name: 'David Wilson',
      email: 'david.w@company.com',
      password: 'password123',
      role: 'manager',
      department: 'Engineering',
      designation: 'Engineering Manager',
      joiningDate: new Date(),
      monthlySalary: 75000,
      reportsTo: techHead._id
    });

    // Create Tech Employees
    for (let i = 1; i <= 3; i++) {
      await User.create({
        employeeId: `TECH00${i + 2}`,
        name: `Software Eng ${i}`,
        email: `dev${i}@company.com`,
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        joiningDate: new Date(),
        monthlySalary: 60000,
        reportsTo: techManager1._id
      });
    }
    console.log('Created Tech Manager and 3 Engineers');

    console.log('Hierarchy Seeding Complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedHierarchy();
