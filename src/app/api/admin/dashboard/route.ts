import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Stats
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    const attendancesToday = await Attendance.find({ date: { $gte: today } }).populate('userId');
    const presentToday = attendancesToday.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentToday = totalEmployees - presentToday; // Simple estimation, ideally count those marked absent
    const lateEmployees = attendancesToday.filter(a => a.status === 'late').length;

    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // Recent Activities (latest attendances today)
    const recentAttendances = await Attendance.find({ date: { $gte: today } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'name');

    const activities = recentAttendances.map(a => {
      let text = `${(a.userId as any).name} checked in`;
      let type = 'success';
      if (a.status === 'late') {
        text = `${(a.userId as any).name} logged in late`;
        type = 'warning';
      }
      if (a.logoutTime) {
        text = `${(a.userId as any).name} checked out`;
        type = 'info';
      }
      return {
        text,
        time: a.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type
      };
    });

    // Pending Leave Requests
    const leaveRequests = await Leave.find({ status: 'pending' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateEmployees,
        pendingLeaves,
      },
      activities,
      leaveRequests,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
