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

    const { leaveType, fromDate, toDate, reason, attachments, duration = 'full_day', halfDaySession = null } = await req.json();

    // Calculate number of days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    if (duration === 'half_day') {
      if (numberOfDays !== 1) {
        return NextResponse.json({ error: 'Half day leave must be for a single date' }, { status: 400 });
      }
      if (!halfDaySession) {
        return NextResponse.json({ error: 'Session (First Half / Second Half) is required for half day leave' }, { status: 400 });
      }
      numberOfDays = 0.5;
    }

    await dbConnect();

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      userId: session.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { fromDate: { $lte: end }, toDate: { $gte: start } }
      ]
    });

    if (overlappingLeave) {
      if (duration === 'half_day' && overlappingLeave.duration === 'half_day' && overlappingLeave.fromDate.getTime() === start.getTime() && overlappingLeave.halfDaySession !== halfDaySession) {
         // Allow first half and second half on same day? Wait, requirements say: "Cannot submit: First Half + Second Half separately for same date"
         return NextResponse.json({ error: 'Overlapping leave detected. You already have a half day leave on this date. Please apply for a full day leave instead.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'You already have a pending or approved leave during this period' }, { status: 400 });
    }

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
      duration,
      halfDaySession,
      attachments,
      reason,
      status: initialStatus as any,
      currentApprover: undefined,
    });

    if (currentApprover) {
      let leaveDesc = 'leave';
      if (duration === 'half_day') {
         leaveDesc = halfDaySession === 'first_half' ? 'First Half Leave' : 'Second Half Leave';
      }

      await Notification.create({
        recipientId: currentApprover,
        type: 'LEAVE_REQUEST',
        message: `${user?.name} has applied for ${leaveDesc} and requires your approval.`,
        link: user?.role === 'employee' ? '/employee/leaves' : '/admin/leaves',
      });
    }

    return NextResponse.json({ message: 'Leave applied successfully', leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
