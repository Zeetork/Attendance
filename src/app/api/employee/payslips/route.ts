import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const payrolls = await Payroll.find({ userId: session.user.id })
      .sort({ year: -1, month: -1 })
      .populate('userId', 'name employeeId department designation bankName accountNumber ifscCode joiningDate address location leaveBalance salaryDeductions')
      .lean();

    return NextResponse.json({ payrolls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
