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

    const { leaveType, fromDate, toDate, reason, attachments } = await req.json();

    // Calculate number of days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    await dbConnect();

    const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
    
    const eligibility = await LeaveBalanceEngine.checkEligibility(session.user.id, leaveType, numberOfDays);

    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    if (eligibility.requiresDocument && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Supporting documents are required for this leave type.' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    let currentApprover = user?.reportsTo;

    // If there's no manager, try to find an admin to be the current approver
    if (!currentApprover) {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) currentApprover = admin._id;
    }
    
    let initialStatus = 'pending';

    const leave = await Leave.create({
      userId: session.user.id,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfDays,
      attachments,
      reason,
      status: initialStatus as any,
      currentApprover: undefined,
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
