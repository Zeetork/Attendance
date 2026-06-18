import { NextRequest, NextResponse } from 'next/server';
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
    let isHalfDayLeave = false;
    let halfDaySession = null;

    // Check for approved leave today
    const Leave = (await import('@/models/Leave')).default;
    const activeLeave = await Leave.findOne({
      userId,
      status: 'approved',
      fromDate: { $lte: todayEnd },
      toDate: { $gte: todayStart }
    });

    if (activeLeave && activeLeave.duration === 'half_day') {
      isHalfDayLeave = true;
      halfDaySession = activeLeave.halfDaySession;
    } else if (activeLeave && activeLeave.duration !== 'half_day') {
      return Response.json({ error: 'You are on full day leave today' }, { status: 400 });
    }

    if (user.shiftId) {
      const shift = user.shiftId as any;
      const [startHours, startMinutes] = shift.startTime.split(':');
      const [endHours, endMinutes] = shift.endTime.split(':');
      
      let finalStartHours = parseInt(startHours);
      let finalStartMinutes = parseInt(startMinutes);

      if (isHalfDayLeave && halfDaySession === 'first_half') {
        // First Half Leave -> work second half. So expected login is midway
        const totalMinutes = (parseInt(endHours) * 60 + parseInt(endMinutes)) - (parseInt(startHours) * 60 + parseInt(startMinutes));
        const midPointMinutes = (parseInt(startHours) * 60 + parseInt(startMinutes)) + (totalMinutes / 2);
        finalStartHours = Math.floor(midPointMinutes / 60);
        finalStartMinutes = midPointMinutes % 60;
      }
      
      expectedLoginTime.setHours(finalStartHours, finalStartMinutes, 0, 0);
      graceTime = shift.graceTime || 15;
    } else {
      let defaultStart = 9;
      if (isHalfDayLeave && halfDaySession === 'first_half') {
        defaultStart = 14; // 2 PM
      }
      expectedLoginTime.setHours(defaultStart, 0, 0, 0); // Default if no shift
    }

    let status: 'present' | 'late' | 'half-day' = isHalfDayLeave ? 'half-day' : 'present';
    let lateMinutes = 0;

    const diffMins = differenceInMinutes(now, expectedLoginTime);
    if (diffMins > graceTime && !isHalfDayLeave) { // if half-day leave, keep status as half-day
      status = 'late';
      lateMinutes = diffMins;
    } else if (diffMins > graceTime && isHalfDayLeave) {
      lateMinutes = diffMins;
    }

    const attendance = await Attendance.create({
      userId,
      date: todayStart,
      shiftId,
      loginTime: now,
      status,
      lateMinutes,
      companyId: session.user.companyId,
    });

    if (status === 'late') {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        targetRole: 'admin',
        type: 'LATE_CHECKIN',
        message: `${user.name} checked in late by ${lateMinutes} minutes.`,
        link: '/admin/attendance',
        companyId: session.user.companyId,
      });
    }

    return Response.json({ message: 'Checked in successfully', attendance }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
