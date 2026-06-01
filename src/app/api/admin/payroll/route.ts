import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Holiday from '@/models/Holiday';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    await dbConnect();
    const payrolls = await Payroll.find({ month, year })
      .populate('userId', 'name employeeId department profileImage')
      .sort({ generatedAt: -1 })
      .lean();

    return NextResponse.json({ payrolls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = await req.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    await dbConnect();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all active employees
    const users = await User.find({ role: 'employee', isActive: true });
    
    // Get holidays
    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
      holidayType: { $in: ['public', 'company'] }
    });

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Calculate total working days in the month (excluding Sundays and holidays)
    let totalWorkingDays = 0;
    daysInMonth.forEach(d => {
      const isWeekend = d.getDay() === 0; // Only Sunday is a weekend
      const isHoliday = holidays.some(h => isSameDay(new Date(h.date), d));
      if (!isWeekend && !isHoliday) {
        totalWorkingDays++;
      }
    });

    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const generatedPayrolls = [];

    for (const user of users) {
      // Get attendances for this user
      const attendances = await Attendance.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate }
      });

      let presentDays = 0;
      let halfDays = 0;

      attendances.forEach(a => {
        if (a.status === 'present' || a.status === 'late') presentDays++;
        if (a.status === 'half-day') halfDays++;
      });

      // Simple absent days calculation
      const absentDays = totalWorkingDays - (presentDays + (halfDays * 0.5));
      const penaltyDays = Math.max(0, absentDays); // If negative somehow, 0

      const monthlySalary = user.monthlySalary || 0;
      const perDaySalary = monthlySalary / totalDaysInMonth; // Salary divided by actual days in the month
      const deductions = penaltyDays * perDaySalary;
      const finalSalary = monthlySalary - deductions;

      // Upsert payroll
      const payroll = await Payroll.findOneAndUpdate(
        { userId: user._id, month, year },
        {
          totalWorkingDays,
          presentDays,
          absentDays: penaltyDays,
          halfDays,
          monthlySalary,
          deductions,
          finalSalary,
          generatedAt: new Date()
        },
        { upsert: true, new: true }
      ).populate('userId', 'name employeeId');

      generatedPayrolls.push(payroll);
    }

    return NextResponse.json({ message: 'Payroll generated successfully', count: generatedPayrolls.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
