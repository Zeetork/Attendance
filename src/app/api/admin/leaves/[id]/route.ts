import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, approvedBy: session.user.id },
      { new: true }
    );

    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (status !== 'pending') {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        recipientId: leave.userId,
        type: 'LEAVE_UPDATE',
        message: `Your ${leave.leaveType} leave request has been ${status}.`,
        link: '/employee/leaves',
      });
    }

    return NextResponse.json({ message: 'Leave status updated', leave });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
