import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const {
      employeeId, name, email, password, department, designation, shiftId, joiningDate, monthlySalary, phoneNumber, profileImage, isActive, bankName, accountNumber, ifscCode
    } = data;

    await dbConnect();

    const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      return Response.json({ error: 'User with this email or ID already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      department,
      designation,
      shiftId: shiftId || undefined,
      joiningDate: new Date(joiningDate),
      monthlySalary: Number(monthlySalary),
      role: 'employee',
      phoneNumber,
      profileImage,
      bankName,
      accountNumber,
      ifscCode,
      isActive: isActive !== undefined ? isActive : true
    });

    return Response.json({ message: 'Employee created successfully' }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
