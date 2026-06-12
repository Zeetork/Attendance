import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
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

    const allEmployees = await User.find({ role: 'employee', isActive: true, leaveBalance: { $exists: true } });
    let totalSLUsed = 0;
    let totalCLUsed = 0;
    let totalLWPUsed = 0;
    allEmployees.forEach(emp => {
       if (emp.leaveBalance) {
         totalSLUsed += emp.leaveBalance.sickLeave?.taken || 0;
         totalCLUsed += emp.leaveBalance.casualLeave?.taken || 0;
         totalLWPUsed += emp.leaveBalance.leaveWithoutPay?.taken || 0;
       }
    });

    // Recent Activities (latest attendances today)
    const recentAttendances = await Attendance.find({ date: { $gte: today } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'name');

    const activities = recentAttendances.map(a => {
      const userName = a.userId ? (a.userId as any).name : 'Unknown User';
      let text = `${userName} checked in`;
      let type = 'success';
      if (a.status === 'late') {
        text = `${userName} logged in late`;
        type = 'warning';
      }
      if (a.logoutTime) {
        text = `${userName} checked out`;
        type = 'info';
      }
      return {
        text,
        time: (a as any).updatedAt ? (a as any).updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        totalSLUsed,
        totalCLUsed,
        totalLWPUsed
      },
      activities,
      leaveRequests,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
