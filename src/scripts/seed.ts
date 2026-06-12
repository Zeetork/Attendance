import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined');
}

// Define Schemas for seed script to avoid Next.js module loading issues
const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyCode: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  logo: { type: String },
  status: { type: Boolean, default: true },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  companyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['super_admin', 'admin', 'manager', 'employee'], default: 'employee' },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  shift: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  monthlySalary: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // 1. Create Multiple Companies
    const companiesData = [
      {
        companyName: 'ZeeTork',
        companyCode: 'ZT',
        email: 'admin@zeetork.com',
        phone: '+1234567890',
        address: 'ZT Headquarters',
        status: true,
      },
      {
        companyName: 'TruFlow',
        companyCode: 'TF',
        email: 'admin@truflow.com',
        phone: '+1987654321',
        address: 'TF Building',
        status: true,
      }
    ];

    const companyIds: mongoose.Types.ObjectId[] = [];
    
    for (const data of companiesData) {
      let company = await Company.findOne({ companyCode: data.companyCode });
      if (!company) {
        company = await Company.create(data);
        console.log(`Created Company: ${data.companyName}`);
      }
      companyIds.push(company._id);
    }

    const hashedPassword = await bcrypt.hash('123123', 10);
    const adminHashed = await bcrypt.hash('admin123', 10);

    // 2. Create/Update a Single Admin for ALL companies
    await User.findOneAndUpdate(
      { email: 'admin@zohohrms.com' },
      {
        companyId: companyIds[0], // Default active company
        companyIds: companyIds,   // Has access to all
        employeeId: 'EMP001',
        name: 'Super Admin',
        email: 'admin@zohohrms.com',
        password: adminHashed,
        role: 'admin',
        department: 'Management',
        designation: 'Director',
        shift: 'A',
        joiningDate: new Date(),
        monthlySalary: 100000,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('Created/Updated Single Admin for all companies');

    // 3. Create/Update Different Employees for EACH company
    const employeesData = [
      {
        email: 'nishanth@gmail.com',
        empId: 'EMPTF001',
        name: 'Nishanth (TruFlow)',
        companyIdx: 1
      }
    ];

    for (const emp of employeesData) {
      await User.findOneAndUpdate(
        { email: emp.email },
        {
          companyId: companyIds[emp.companyIdx],
          companyIds: [companyIds[emp.companyIdx]],
          employeeId: emp.empId,
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          role: 'employee',
          department: 'Engineering',
          designation: 'Software Engineer',
          shift: 'A',
          joiningDate: new Date(),
          monthlySalary: 80000,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log(`Created/Updated Employee: ${emp.email} for ${companiesData[emp.companyIdx].companyName}`);
    }

    console.log('Data seeded successfully!');
    console.log('--- Credentials ---');
    console.log('Admin (All Companies): admin@zohohrms.com / admin123');
    for (const emp of employeesData) {
      console.log(`Employee (${companiesData[emp.companyIdx].companyName}): ${emp.email} / 123123`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();