import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import '@/models/Shift'; // Side-effect import to ensure model registration
import Holiday from '@/models/Holiday';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await User.findById(session.user.id)
      .populate('shiftId')
      .populate('reportsTo', 'employeeId name role designation department profileImage')
      .lean() as any;

    const subordinates = await User.find({ reportsTo: session.user.id })
      .select('employeeId name role designation department profileImage')
      .lean();
    
    // Attendances
    const attendances = await Attendance.find({ userId: session.user.id }).sort({ date: -1 }).limit(30);
    const todayAttendance = attendances.find(a => new Date(a.date).getTime() === today.getTime());
    
    // Calculate Monthly %
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAttendances = attendances.filter(a => new Date(a.date) >= firstDayOfMonth);
    const presentDays = monthAttendances.filter(a => a.status === 'present' || a.status === 'late').length;
    
    // Ideally calculate total working days till today
    const holidaysThisMonth = await Holiday.find({
      date: { $gte: firstDayOfMonth, $lte: today },
      holidayType: { $in: ['public', 'company'] }
    });
    
    let workingDays = 0;
    for (let d = new Date(firstDayOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) { // Only exclude Sunday
        // Check if day is a holiday
        const isHoliday = holidaysThisMonth.some(h => new Date(h.date).getTime() === d.getTime());
        if (!isHoliday) {
          workingDays++;
        }
      }
    }
    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100;

    // Leaves
    const leaves = await Leave.find({ userId: session.user.id, status: 'approved' });
    const takenLeaves = leaves.reduce((acc, l) => {
      const days = Math.ceil((new Date(l.toDate).getTime() - new Date(l.fromDate).getTime()) / (1000 * 3600 * 24)) + 1;
      return acc + days;
    }, 0);
    const leaveBalance = 24 - takenLeaves; // Assuming 24 annual leaves

    // Recent
    const recentAttendances = attendances.slice(0, 5).map(a => ({
      date: a.date,
      loginTime: a.loginTime,
      logoutTime: a.logoutTime,
      status: a.status
    }));

    // Upcoming Leaves
    const upcomingLeaves = await Leave.find({ 
      userId: session.user.id, 
      fromDate: { $gte: today },
      status: { $in: ['pending', 'approved'] }
    }).sort({ fromDate: 1 }).limit(3);

    return NextResponse.json({
      shift: user?.shiftId,
      todayAttendance,
      attendancePercentage,
      presentDays,
      workingDays,
      leaveBalance,
      recentAttendances,
      upcomingLeaves,
      manager: user?.reportsTo || null,
      subordinates,
      currentUser: {
        employeeId: user?.employeeId,
        name: user?.name,
        role: user?.role,
        designation: user?.designation,
        department: user?.department,
        profileImage: user?.profileImage
      }
    });

  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
