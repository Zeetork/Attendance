import { NextResponse } from 'next-auth/middleware'; // Need standard NextResponse instead
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import Shift from '@/models/Shift';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existingAttendance) {
      return Response.json({ error: 'Already checked in today' }, { status: 400 });
    }

    const user = await User.findById(userId).populate('shiftId');
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    let expectedLoginTime = new Date(now);
    let shiftId = user.shiftId?._id;
    let graceTime = 15;

    if (user.shiftId) {
      const [hours, minutes] = user.shiftId.startTime.split(':');
      expectedLoginTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      graceTime = user.shiftId.graceTime || 15;
    } else {
      expectedLoginTime.setHours(9, 0, 0, 0); // Default if no shift
    }

    let status = 'present';
    let lateMinutes = 0;

    const diffMins = differenceInMinutes(now, expectedLoginTime);
    if (diffMins > graceTime) {
      status = 'late';
      lateMinutes = diffMins;
    }

    const attendance = await Attendance.create({
      userId,
      date: todayStart,
      shiftId,
      loginTime: now,
      status,
      lateMinutes,
    });

    if (status === 'late') {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        targetRole: 'admin',
        type: 'LATE_CHECKIN',
        message: `${user.name} checked in late by ${lateMinutes} minutes.`,
        link: '/admin/attendance',
      });
    }

    return Response.json({ message: 'Checked in successfully', attendance }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
