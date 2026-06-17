import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    await dbConnect();
    const payrolls = await Payroll.find({ month, year })
      .populate({
        path: 'userId',
        select: 'name employeeId department profileImage shiftId',
        populate: {
          path: 'shiftId',
          model: 'Shift',
          select: 'shiftName workingDays'
        }
      })
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
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = await req.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const activeCompanyId = cookieStore.get('activeCompanyId')?.value || session.user.companyId;

    await dbConnect();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all active employees with their shifts
    const users = await User.find({ role: { $in: ['employee', 'manager', 'team_head', 'department_head'] }, isActive: true }).populate('shiftId');
    console.log(`Found ${users.length} users for company ${activeCompanyId}`);

    // Get holidays
    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
      holidayType: { $in: ['public', 'company'] }
    });

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    const totalCalendarDays = new Date(year, month, 0).getDate();

    const generatedPayrolls = [];

    for (const user of users) {
      const shift = user.shiftId as any;
      const workingDaysPattern = shift?.workingDays && shift.workingDays.length > 0 
        ? shift.workingDays 
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // Default 6 days

      let totalWorkingDays = 0;
      let weeklyOffDays = 0;
      let holidayDays = 0;

      daysInMonth.forEach(d => {
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
        const isWeeklyOff = !workingDaysPattern.includes(dayName);
        const isHoliday = holidays.some(h => isSameDay(new Date(h.date), d));

        if (isWeeklyOff) {
          weeklyOffDays++;
        } else if (isHoliday) {
          holidayDays++;
        } else {
          totalWorkingDays++;
        }
      });

      // Get attendances for this user
      const attendances = await Attendance.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate }
      });

      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      let explicitAbsent = 0;

      attendances.forEach(a => {
        if (['present', 'late', 'Work From Home', 'On Duty'].includes(a.status)) presentDays++;
        if (a.status === 'half-day') halfDays++;
        if (a.status === 'Leave') leaveDays++;
        if (a.status === 'absent') explicitAbsent++;
      });

      // Calculate absent days based on punches vs working days
      // If employee didn't punch on a working day (and no leave/holiday/weekly off), they are absent
      const actualPunches = presentDays + (halfDays * 0.5) + leaveDays + explicitAbsent;
      let missingPunches = totalWorkingDays - actualPunches;
      if (missingPunches < 0) missingPunches = 0;

      const absentDays = explicitAbsent + missingPunches;

      const monthlySalary = user.monthlySalary || 0;
      const perDaySalary = monthlySalary / totalCalendarDays; 

      // Deduction = Absent Days + Leave Days (Assuming leaves are unpaid, per instruction "Deduction Days = Absent Days + Unpaid Leave Days")
      const deductionDays = absentDays + leaveDays;
      const deductionAmount = deductionDays * perDaySalary;
      const netSalary = monthlySalary - deductionAmount;
      const paidDays = totalCalendarDays - deductionDays;

      // Upsert payroll
      const payroll = await Payroll.findOneAndUpdate(
        { userId: user._id, month, year, companyId: activeCompanyId },
        {
          totalCalendarDays,
          totalWorkingDays,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          weeklyOffDays,
          holidayDays,
          paidDays,
          deductionDays,
          monthlySalary,
          grossSalary: monthlySalary,
          deductionAmount,
          netSalary,
          generatedAt: new Date(),
          companyId: activeCompanyId,
          // Legacy fields for backward compatibility
          deductions: deductionAmount,
          finalSalary: netSalary
        },
        {
  upsert: true,
  returnDocument: 'after',
  bypassTenant: true
}
      ).populate('userId', 'name employeeId');

      generatedPayrolls.push(payroll);
    }

    console.log(`Successfully generated ${generatedPayrolls.length} payrolls`);
    return NextResponse.json({ message: 'Payroll generated successfully', count: generatedPayrolls.length }, { status: 201 });
  } catch (error: any) {
  console.error('PAYROLL ERROR:', error);

  return NextResponse.json(
    {
      error: error.message,
      stack: error.stack
    },
    { status: 500 }
  );
}
}
