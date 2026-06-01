import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveType, fromDate, toDate, reason } = await req.json();

    await dbConnect();

    const user = await User.findById(session.user.id);
    let currentApprover = user?.reportsTo;
    let initialStatus = currentApprover ? 'pending' : 'pending_admin_approval';

    // If there's no manager, try to find an admin to be the current approver
    if (!currentApprover) {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) currentApprover = admin._id;
    }

    const leave = await Leave.create({
      userId: session.user.id,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: initialStatus,
      currentApprover
    });

    if (currentApprover) {
      await Notification.create({
        recipientId: currentApprover,
        type: 'LEAVE_REQUEST',
        message: `${user?.name} has applied for leave and requires your approval.`,
        link: user?.role === 'employee' ? '/employee/leaves' : '/admin/leaves',
      });
    }

    return NextResponse.json({ message: 'Leave applied successfully', leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
