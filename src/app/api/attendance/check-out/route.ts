import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
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

    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).populate('shiftId').lean();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const shift = user.shiftId as any;
    if (!shift || !shift.sessions || shift.sessions.length === 0) {
      return Response.json({ error: 'No shift or sessions assigned' }, { status: 400 });
    }

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (!attendance) {
      return Response.json({ error: 'Not checked in today' }, { status: 400 });
    }

    const currentIstTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });

    const { activeSession, currentStatus, sessionState } = getActiveSessionInfo(
      shift.sessions, 
      attendance.sessions, 
      currentIstTime
    );

    if (!activeSession) {
      return Response.json({ error: 'No active session found at this time' }, { status: 400 });
    }

    if (currentStatus !== 'CAN_CHECK_OUT' || !sessionState) {
      return Response.json({ error: 'You are not checked in for this session or already checked out' }, { status: 400 });
    }

    // Process checkout
    const sessionIndex = attendance.sessions.findIndex(s => s.sessionOrder === activeSession.order);
    if (sessionIndex > -1) {
      attendance.sessions[sessionIndex].checkOut = now;
      
      // Calculate late checkout if applicable or set as completed
      const [endHours, endMinutes] = activeSession.endTime.split(':');
      const expectedEndStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${endHours.padStart(2, '0')}:${endMinutes.padStart(2, '0')}:00+05:30`;
      const expectedEndTime = new Date(expectedEndStr);
      
      if (attendance.sessions[sessionIndex].lateMinutes > 0) {
        attendance.sessions[sessionIndex].status = 'Late';
      } else {
        attendance.sessions[sessionIndex].status = 'Completed';
      }
    }

    // For legacy UI support
    if (activeSession.order === shift.sessions[shift.sessions.length - 1].order) {
      attendance.logoutTime = now;
      
      let totalMinutes = 0;
      attendance.sessions.forEach(s => {
        if (s.checkIn && s.checkOut) {
          totalMinutes += differenceInMinutes(new Date(s.checkOut), new Date(s.checkIn));
        }
      });
      const totalHours = totalMinutes / 60;
      attendance.totalHours = totalHours;

      if (totalHours < 4 && attendance.status !== 'absent') {
        attendance.status = 'half-day';
      }

      // Permission Module: Extra Minutes Calculation
      let scheduledMinutes = 0;
      shift.sessions.forEach((s: any) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        scheduledMinutes += (eh * 60 + em) - (sh * 60 + sm);
      });
      attendance.scheduledMinutes = scheduledMinutes;
      attendance.workedMinutes = totalMinutes;

      const firstSession = shift.sessions[0];
      const lastSession = shift.sessions[shift.sessions.length - 1];

      let totalExtra = 0;
      if (scheduledMinutes > 0 && totalMinutes > scheduledMinutes) {
        totalExtra = totalMinutes - scheduledMinutes;
      }

      // Legacy fields (optional, but keep zeroed out to prevent confusion)
      attendance.extraBeforeShiftMinutes = 0;
      attendance.extraAfterShiftMinutes = 0;
      
      const previousTotalExtra = attendance.totalExtraMinutes || 0;
      const previousAvailable = attendance.availableExtraMinutes || 0;
      
      attendance.totalExtraMinutes = totalExtra;
      
      // Calculate how much was already used
      const previouslyUsed = previousTotalExtra - previousAvailable;
      const newlyUsed = isNaN(previouslyUsed) || previouslyUsed < 0 ? 0 : previouslyUsed;
      attendance.availableExtraMinutes = Math.max(0, totalExtra - newlyUsed);
    }

    await attendance.save();

    // Comp-Off Engine logic (Only on final checkout)
    if (activeSession.order === shift.sessions[shift.sessions.length - 1].order) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[now.getDay()];

      const isWeeklyOff = shift && !shift.workingDays.includes(dayName);

      const Holiday = (await import('@/models/Holiday')).default;
      const isHoliday = await Holiday.exists({
        date: { $gte: todayStart, $lte: todayEnd },
        holidayType: { $in: ['public', 'company'] }
      });

      if (isWeeklyOff || isHoliday) {
        const CompOffCredit = (await import('@/models/CompOffCredit')).default;

        const existingCredit = await CompOffCredit.findOne({ employeeId: userId, attendanceDate: { $gte: todayStart, $lte: todayEnd } });

        if (!existingCredit) {
          const expiry = new Date(now);
          expiry.setMonth(expiry.getMonth() + 3); 

          await CompOffCredit.create({
            employeeId: userId,
            attendanceDate: now,
            earnedDate: now,
            availableFromDate: now, 
            expiryDate: expiry,
            companyId: session.user.companyId,
          });

          const Notification = (await import('@/models/Notification')).default;
          await Notification.create({
            recipientId: userId,
            type: 'COMP_OFF_EARNED',
            message: 'You have earned 1 Compensatory Off for working on a holiday/Weekly Off.',
            link: '/employee/leaves',
            companyId: session.user.companyId,
          });
        }
      }
    }

    return Response.json({ message: 'Checked out successfully', attendance }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
