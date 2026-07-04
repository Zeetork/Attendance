import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
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
    const users = await User.find({ role: { $in: ['employee', 'intern', 'manager', 'team_head', 'department_head'] }, isActive: true }).populate('shiftId');
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

      // Get leaves for this user
      const leaves = await Leave.find({
        userId: user._id,
        status: 'approved',
        $or: [
          { fromDate: { $lte: endDate }, toDate: { $gte: startDate } }
        ]
      });

      let presentDays = 0;
      let halfDays = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let explicitAbsent = 0;

      attendances.forEach(a => {
        if (['present', 'late', 'Work From Home', 'On Duty'].includes(a.status)) presentDays++;
        if (a.status === 'half-day') halfDays++;
        if (a.status === 'absent') explicitAbsent++;
      });

      // Process leaves to count paid and unpaid leave days within this month
      leaves.forEach(l => {
        const from = new Date(Math.max(l.fromDate.getTime(), startDate.getTime()));
        const to = new Date(Math.min(l.toDate.getTime(), endDate.getTime()));
        
        let daysInMonth = 0;
        let currentDate = new Date(from);
        while (currentDate <= to) {
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
          const isWeeklyOff = !workingDaysPattern.includes(dayName);
          const isHoliday = holidays.some(h => isSameDay(new Date(h.date), currentDate));
          
          if (!isWeeklyOff && !isHoliday) {
            daysInMonth++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (l.duration === 'half_day') {
          daysInMonth = 0.5;
        }

        if (l.leaveType === 'Leave Without Pay') {
          unpaidLeaveDays += daysInMonth;
        } else {
          paidLeaveDays += daysInMonth;
        }
      });

      // Calculate absent days based on punches vs working days
      // If employee didn't punch on a working day (and no leave/holiday/weekly off), they are absent
      const actualPunches = presentDays + (halfDays * 0.5) + paidLeaveDays + unpaidLeaveDays + explicitAbsent;
      let missingPunches = totalWorkingDays - actualPunches;
      if (missingPunches < 0) missingPunches = 0;

      const absentDays = explicitAbsent + missingPunches;

      const monthlySalary = user.monthlySalary || 0;
      const perDaySalary = monthlySalary / totalCalendarDays; 

      // Deduction = Absent Days + Unpaid Leave Days (Paid leaves do not deduct from salary)
      const deductionDays = absentDays + unpaidLeaveDays;
      let deductionAmount = deductionDays * perDaySalary;
      const paidDays = totalCalendarDays - deductionDays;
      const leaveDays = paidLeaveDays + unpaidLeaveDays;

      // New: Salary Deductions
      let esiDeduction = 0;
      let hraDeduction = 0;
      let loanDeduction = 0;

      if (user.role !== 'intern') {

      if (monthlySalary <= 21000) {
        esiDeduction = Math.round(monthlySalary * 0.0075);
      }

      if (user.salaryDeductions?.hra?.enabled) {
        hraDeduction = user.salaryDeductions.hra.amount || 0;
      }

      if (user.salaryDeductions?.loan?.enabled && user.salaryDeductions.loan.remainingMonths > 0) {
        let isWithinDates = true;
        
        if (user.salaryDeductions.loan.startDate && user.salaryDeductions.loan.endDate) {
           const payrollYearMonth = year * 100 + month; 
           const startD = new Date(user.salaryDeductions.loan.startDate);
           const endD = new Date(user.salaryDeductions.loan.endDate);
           const startYM = startD.getFullYear() * 100 + (startD.getMonth() + 1);
           const endYM = endD.getFullYear() * 100 + (endD.getMonth() + 1);
           
           if (payrollYearMonth < startYM || payrollYearMonth > endYM) {
             isWithinDates = false;
           }
        }

        if (isWithinDates) {
          loanDeduction = user.salaryDeductions.loan.monthlyDeduction || 0;

          // Process Loan
          user.salaryDeductions.loan.remainingMonths -= 1;
          user.salaryDeductions.loan.totalPaid += loanDeduction;

          if (user.salaryDeductions.loan.remainingMonths <= 0) {
            user.salaryDeductions.loan.completed = true;
            user.salaryDeductions.loan.enabled = false;
            user.salaryDeductions.loan.remainingMonths = 0;
          }

          user.markModified('salaryDeductions');
          await user.save();
        }
      }
      } // End if (user.role !== 'intern')

      deductionAmount += esiDeduction + hraDeduction + loanDeduction;
      const netSalary = monthlySalary - deductionAmount;

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
          salaryDeductionsSnapshot: {
            esi: esiDeduction,
            hra: hraDeduction,
            loan: loanDeduction
          },
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
