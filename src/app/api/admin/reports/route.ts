import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payroll from '@/models/Payroll';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const employees = await User.countDocuments({ role: 'employee', isActive: true });
    
    // Attendance Stats (last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const attendanceStats = await Promise.all(last7Days.map(async (dateStr) => {
      const start = new Date(dateStr);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const attendances = await Attendance.find({ date: { $gte: start, $lt: end } });
      const present = attendances.filter(a => a.status === 'present').length;
      const late = attendances.filter(a => a.status === 'late').length;
      const halfDay = attendances.filter(a => a.status === 'half-day').length;

      return {
        date: dateStr.split('-').slice(1).join('/'),
        present,
        late,
        halfDay
      };
    }));

    // Leave Stats
    const leaves = await Leave.find();
    const leaveStats = {
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length
    };

    // Payroll Stats (current month)
    const payrolls = await Payroll.find({ month: currentMonth, year: currentYear });
    const payrollStats = {
      totalGenerated: payrolls.length,
      totalPayout: payrolls.reduce((sum, p) => sum + (p.finalSalary || 0), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0)
    };

    return NextResponse.json({
      employees,
      attendanceStats,
      leaveStats,
      payrollStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
