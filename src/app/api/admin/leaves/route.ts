import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User'; // Ensure User is registered

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const leaves = await Leave.find()
      .populate('userId', 'name employeeId profileImage department')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ leaves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
