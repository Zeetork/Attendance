import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { casualLeave, sickLeave, restrictedLeave, compensatoryOff } = body;

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.leaveBalance) {
      return NextResponse.json({ error: 'User has no leave balance initialized' }, { status: 400 });
    }

    user.leaveBalance.casualLeave.available = casualLeave;
    user.leaveBalance.sickLeave.available = sickLeave;
    user.leaveBalance.restrictedLeave.available = restrictedLeave;
    user.leaveBalance.compensatoryOff.available = compensatoryOff;

    user.markModified('leaveBalance');
    await user.save();

    return NextResponse.json({ message: 'Leave balance updated successfully', leaveBalance: user.leaveBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
