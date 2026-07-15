import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { differenceInMinutes } from 'date-fns';
import { getActiveSessionInfo } from '@/lib/sessionUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;
    const now = new Date();
    
    // Get the current date in IST
    const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const [month, day, year] = istDateString.split('/');
    
    // Create UTC midnight representing the start of the day for the IST date
    const todayStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));

    const user = await User.findById(userId).populate('shiftId').lean();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const shift = user.shiftId as any;
    if (!shift || !shift.sessions || shift.sessions.length === 0) {
      return Response.json({ error: 'No shift or sessions assigned' }, { status: 400 });
    }

    // Get IST current time HH:mm
    const currentIstTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });

    let existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (!existingAttendance) {
      existingAttendance = await Attendance.create({
        userId,
        date: todayStart,
        shiftId: shift._id,
        status: 'present',
        sessions: [],
        companyId: session.user.companyId,
      });
    }

    const { activeSession, currentStatus, sessionState } = getActiveSessionInfo(
      shift.sessions, 
      existingAttendance.sessions, 
      currentIstTime
    );

    if (!activeSession) {
      return Response.json({ error: 'No active session found at this time' }, { status: 400 });
    }

    if (currentStatus !== 'CAN_CHECK_IN') {
      return Response.json({ error: 'You cannot check in at this time' }, { status: 400 });
    }

    // Calculate expected login time
    const [startHours, startMinutes] = activeSession.startTime.split(':');
    const expectedLoginStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${startHours.padStart(2, '0')}:${startMinutes.padStart(2, '0')}:00+05:30`;
    const expectedLoginTime = new Date(expectedLoginStr);
    const graceTime = activeSession.graceTime || 0;

    const diffMins = differenceInMinutes(now, expectedLoginTime);
    
    let lateMinutes = 0;
    let sessionStatus = 'Pending';
    
    if (diffMins > graceTime) {
      lateMinutes = diffMins;
      sessionStatus = 'Pending'; // Will be 'Late' on checkout? No, let's keep it 'Pending' until checkout, or 'Late' if late checkout is missed. Actually, prompt: "If Late <= 0 Status On Time Else Late".
    }

    // Push new session
    existingAttendance.sessions.push({
      sessionOrder: activeSession.order,
      checkIn: now,
      lateMinutes,
      status: 'Pending'
    });
    
    // For legacy UI
    if (existingAttendance.sessions.length === 1) {
      existingAttendance.loginTime = now;
      existingAttendance.lateMinutes = lateMinutes;
      if (lateMinutes > 0) {
        existingAttendance.status = 'late';
      }
    }

    await existingAttendance.save();

    if (lateMinutes > 0) {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        targetRole: 'admin',
        type: 'LATE_CHECKIN',
        message: `${user.name} checked in late by ${lateMinutes} minutes for Session ${activeSession.order}.`,
        link: '/admin/attendance',
        companyId: session.user.companyId,
      });
    }

    return Response.json({ message: 'Checked in successfully', attendance: existingAttendance }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
