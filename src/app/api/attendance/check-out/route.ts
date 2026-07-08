import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
import { differenceInMinutes } from 'date-fns';

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

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).populate('shiftId');

    if (!attendance) {
      return Response.json({ error: 'Not checked in today' }, { status: 400 });
    }

    if (attendance.logoutTime) {
      return Response.json({ error: 'Already checked out today' }, { status: 400 });
    }

    attendance.logoutTime = now;

    // Calculate total hours
    const totalMinutes = differenceInMinutes(now, attendance.loginTime!);
    const totalHours = totalMinutes / 60;
    attendance.totalHours = totalHours;

    // Check for half-day
    if (totalHours < 4 && attendance.status !== 'absent') {
      attendance.status = 'half-day';
    }

    await attendance.save();

    // Comp-Off Engine logic
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[now.getDay()];

    const shift = user?.shiftId as any;
    const isWeeklyOff = shift && !shift.workingDays.includes(dayName);

    const Holiday = (await import('@/models/Holiday')).default;
    const isHoliday = await Holiday.exists({
      date: { $gte: todayStart, $lte: todayEnd },
      holidayType: { $in: ['public', 'company'] }
    });

    if (isWeeklyOff || isHoliday) {
      const CompOffCredit = (await import('@/models/CompOffCredit')).default;

      // Check if credit already exists to prevent duplicates
      const existingCredit = await CompOffCredit.findOne({ employeeId: userId, attendanceDate: { $gte: todayStart, $lte: todayEnd } });

      if (!existingCredit) {
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 3); // expires after 3 months

        await CompOffCredit.create({
          employeeId: userId,
          attendanceDate: now,
          earnedDate: now,
          availableFromDate: now, // Available immediately
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

    return Response.json({ message: 'Checked out successfully', attendance }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
