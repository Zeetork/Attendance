import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await req.json(); // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    const leave = await Leave.findById(id).populate('userId');
    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Check if user is the current approver or an admin
    const currentUser = await User.findById(session.user.id);
    const isAdmin = currentUser?.role === 'admin';
    const isCurrentApprover = leave.currentApprover?.toString() === session.user.id;

    if (!isAdmin && !isCurrentApprover) {
      return NextResponse.json({ error: 'You do not have permission to approve this leave' }, { status: 403 });
    }

    if (status === 'rejected') {
      leave.status = 'rejected';
      leave.approvedBy = session.user.id;
      await leave.save();

      await Notification.create({
        recipientId: leave.userId._id,
        type: 'LEAVE_UPDATE',
        message: `Your ${leave.leaveType} leave request has been rejected.`,
        link: '/employee/leaves',
      });
      return NextResponse.json({ message: 'Leave rejected', leave });
    }

    // If approved
    if (isAdmin) {
      // Admin approval is final
      leave.status = 'approved';
      leave.approvedBy = session.user.id;
      await leave.save();

      await Notification.create({
        recipientId: leave.userId._id,
        type: 'LEAVE_UPDATE',
        message: `Your ${leave.leaveType} leave request has been approved by Admin.`,
        link: '/employee/leaves',
      });
      return NextResponse.json({ message: 'Leave approved by admin', leave });
    } else {
      // Manager approved -> move to admin
      leave.status = 'pending_admin_approval';
      
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        leave.currentApprover = admin._id;
        await Notification.create({
          recipientId: admin._id,
          type: 'LEAVE_ESCALATION',
          message: `Leave request for ${(leave.userId as any).name} requires your final approval.`,
          link: '/admin/leaves',
        });
      }
      
      await leave.save();

      return NextResponse.json({ message: 'Leave approved and escalated to Admin', leave });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
