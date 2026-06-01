import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const leaves = await Leave.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ leaves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveType, fromDate, toDate, reason } = await req.json();

    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const leave = await Leave.create({
      userId: session.user.id,
      leaveType,
      fromDate,
      toDate,
      reason,
      status: 'pending'
    });

    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id);

    const Notification = (await import('@/models/Notification')).default;
    await Notification.create({
      targetRole: 'admin',
      type: 'LEAVE_APPLIED',
      message: `${user?.name || 'An employee'} applied for ${leaveType} leave.`,
      link: '/admin/leaves',
    });

    return NextResponse.json({ message: 'Leave application submitted', leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
