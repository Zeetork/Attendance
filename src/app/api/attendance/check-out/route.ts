import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

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

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

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

    return Response.json({ message: 'Checked out successfully', attendance }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
