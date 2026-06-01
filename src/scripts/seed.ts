import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined');
}

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  shift: { type: String, enum: ['A', 'B'], required: true },
  joiningDate: { type: Date, required: true },
  monthlySalary: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('123123', 10);

    const user = await User.findOneAndUpdate(
      { email: 'sargurudurai25@gmail.com' },
      {
        employeeId: 'EMP002',
        name: 'sarguru',
        email: 'sargurudurai25@gmail.com',
        password: hashedPassword,
        role: 'employee',
        department: 'HR',
        designation: 'HR Manager',
        shift: 'A',
        joiningDate: new Date(),
        monthlySalary: 100000,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Re-create the admin as well so that you have an admin account to manage things!
    const adminHashed = await bcrypt.hash('admin123', 10);
    await User.findOneAndUpdate(
      { email: 'admin@zohohrms.com' },
      {
        employeeId: 'EMP001',
        name: 'Super Admin',
        email: 'admin@zohohrms.com',
        password: adminHashed,
        role: 'admin',
        department: 'HR',
        designation: 'HR Manager',
        shift: 'A',
        joiningDate: new Date(),
        monthlySalary: 100000,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log('Users created/updated successfully:');
    console.log('1. Employee: sargurudurai25@gmail.com / 123123');
    console.log('2. Admin: admin@zohohrms.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();