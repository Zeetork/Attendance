import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({ role: { $ne: 'admin' } }).select('name employeeId');
    return Response.json({ users }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const {
      employeeId, name, email, password, department, designation, shiftId, joiningDate, monthlySalary, phoneNumber, profileImage, isActive, bankName, accountNumber, ifscCode
    } = data;

    await dbConnect();

    const existingUser = await User.findOne(
      { $or: [{ email }, { employeeId }] },
      null,
      { bypassTenant: true }
    );
    if (existingUser) {
      return Response.json({ error: 'User with this email or ID already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cookieStore = await cookies();
    const companyId = cookieStore.get('activeCompanyId')?.value;

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
      isActive: isActive !== undefined ? isActive : true,
      companyId: companyId,
      companyIds: companyId ? [companyId] : []
    });

    return Response.json({ message: 'Employee created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
