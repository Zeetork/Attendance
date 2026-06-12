import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Return relevant employee details for letters
    const employees = await User.find({ role: { $ne: 'admin' }, isActive: true }).select(
      'name email employeeId designation department joiningDate'
    ).sort({ name: 1 });
    
    return NextResponse.json({ employees }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
