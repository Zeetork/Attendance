import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Shift from '@/models/Shift';
import { LeaveBalanceEngine } from '@/services/LeaveBalanceEngine';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { userId, date, status, loginTime, logoutTime, duration = 'full_day', halfDaySession } = data; // date should be "YYYY-MM-DD", loginTime "HH:mm"
    const finalHalfDaySession = (halfDaySession === '' || !halfDaySession) ? null : halfDaySession;

    if (!userId || !date || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const User = (await import('@/models/User')).default;
    await import('@/models/Shift'); // Ensure Shift model is registered before population
    const user = await User.findById(userId).populate('shiftId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse base date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let parsedLoginTime;
    let parsedLogoutTime;
    let totalHours;

    if (loginTime) {
      const [hours, minutes] = loginTime.split(':');
      parsedLoginTime = new Date(attendanceDate);
      parsedLoginTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    if (logoutTime) {
      const [hours, minutes] = logoutTime.split(':');
      parsedLogoutTime = new Date(attendanceDate);
      parsedLogoutTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    if (parsedLoginTime && parsedLogoutTime) {
      const diffMs = parsedLogoutTime.getTime() - parsedLoginTime.getTime();
      totalHours = diffMs / (1000 * 60 * 60);
    }

    const attendanceTypes = ['present', 'absent', 'half-day', 'late'];

    if (!attendanceTypes.includes(status)) {
      const isHalfDay = duration === 'half_day';
      const deductAmount = isHalfDay ? 0.5 : 1;

      // It's a leave override
      const eligibility = await LeaveBalanceEngine.checkEligibility(userId, status, deductAmount);
      if (!eligibility.eligible) {
        return NextResponse.json({ error: eligibility.reason || 'Not eligible for this leave type' }, { status: 400 });
      }

      if (status === 'Restricted Holiday') {
        const Holiday = (await import('@/models/Holiday')).default;
        const isRH = await Holiday.exists({
          date: attendanceDate,
          holidayType: 'restricted'
        });
        if (!isRH) {
          const dateStr = attendanceDate.toISOString().split('T')[0];
          return NextResponse.json({ error: `Cannot override to Restricted Holiday. ${dateStr} is not a designated Restricted Holiday.` }, { status: 400 });
        }
      }

      // Remove existing attendance for this day so it doesn't conflict
      await Attendance.findOneAndDelete({ userId, date: attendanceDate });
      
      const CompOffCredit = (await import('@/models/CompOffCredit')).default;
      await CompOffCredit.findOneAndDelete({ employeeId: userId, attendanceDate });

      // Create or update an approved leave record
      const existingLeave = await Leave.findOne({ userId, fromDate: attendanceDate, toDate: attendanceDate });

      const leave = await Leave.findOneAndUpdate(
        { userId, fromDate: attendanceDate, toDate: attendanceDate },
        {
          $set: {
            leaveType: status,
            numberOfDays: deductAmount,
            duration,
            halfDaySession: isHalfDay ? finalHalfDaySession : null,
            reason: 'Admin Calendar Override',
            status: 'approved'
          }
        },
        { new: true, upsert: true }
      );

      if (!existingLeave || existingLeave.leaveType !== status) {
        const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
        await LeaveBalanceEngine.syncLeaveBalance(userId);
        const user = await User.findById(userId);
        
        if (user && user.leaveBalance) {
          // Refund old leave if changing types
          if (existingLeave) {
            const oldDeductAmount = existingLeave.numberOfDays || 1;
            if (existingLeave.leaveType === 'Casual Leave') {
              user.leaveBalance.casualLeave.taken -= oldDeductAmount;
              user.leaveBalance.casualLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Sick Leave') {
              user.leaveBalance.sickLeave.taken -= oldDeductAmount;
              user.leaveBalance.sickLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Restricted Holiday') {
              user.leaveBalance.restrictedLeave.taken -= oldDeductAmount;
              user.leaveBalance.restrictedLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Maternity Leave') {
              user.leaveBalance.maternityLeave.taken -= oldDeductAmount;
              user.leaveBalance.maternityLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Paternity Leave') {
              user.leaveBalance.paternityLeave.taken -= oldDeductAmount;
              user.leaveBalance.paternityLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Leave Without Pay') {
              user.leaveBalance.leaveWithoutPay.taken -= oldDeductAmount;
            } else if (existingLeave.leaveType === 'Compensatory Off') {
              const credit = await CompOffCredit.findOne({ usedAgainstLeave: existingLeave._id });
              if (credit) {
                credit.isUsed = false;
                credit.usedAgainstLeave = undefined;
                await credit.save();
                user.leaveBalance.compensatoryOff.taken -= oldDeductAmount;
                user.leaveBalance.compensatoryOff.available += oldDeductAmount;
              }
            }
          }

          // Deduct new leave
          if (status === 'Casual Leave') {
            user.leaveBalance.casualLeave.taken += deductAmount;
            user.leaveBalance.casualLeave.available -= deductAmount;
          } else if (status === 'Sick Leave') {
            user.leaveBalance.sickLeave.taken += deductAmount;
            user.leaveBalance.sickLeave.available -= deductAmount;
          } else if (status === 'Restricted Holiday') {
            user.leaveBalance.restrictedLeave.taken += deductAmount;
            user.leaveBalance.restrictedLeave.available -= deductAmount;
          } else if (status === 'Maternity Leave') {
            user.leaveBalance.maternityLeave.taken += deductAmount;
            user.leaveBalance.maternityLeave.available -= deductAmount;
          } else if (status === 'Paternity Leave') {
            user.leaveBalance.paternityLeave.taken += deductAmount;
            user.leaveBalance.paternityLeave.available -= deductAmount;
          } else if (status === 'Leave Without Pay') {
            user.leaveBalance.leaveWithoutPay.taken += deductAmount;
          } else if (status === 'Compensatory Off') {
            const credits = await CompOffCredit.find({ employeeId: userId, isUsed: false }).sort({ earnedDate: 1 }).limit(Math.ceil(deductAmount));
            for (const credit of credits) {
              credit.isUsed = true;
              credit.usedAgainstLeave = leave._id;
              await credit.save();
            }
            if (credits.length > 0) {
              user.leaveBalance.compensatoryOff.taken += deductAmount;
              user.leaveBalance.compensatoryOff.available -= deductAmount;
            }
          }
          user.markModified('leaveBalance');
          await user.save();
        }
      }

      return NextResponse.json({ message: 'Leave overridden successfully', leave });
    } else {
      // It's an attendance override
      // Remove any 1-day leave on this day if exists to prevent conflicts
      const existingLeave = await Leave.findOneAndDelete({ userId, fromDate: attendanceDate, toDate: attendanceDate });
      
      if (existingLeave) {
         // Refund balance
         const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
         await LeaveBalanceEngine.syncLeaveBalance(userId);
         const user = await User.findById(userId);
         if (user && user.leaveBalance) {
            const oldDeductAmount = existingLeave.numberOfDays || 1;
            if (existingLeave.leaveType === 'Casual Leave') {
              user.leaveBalance.casualLeave.taken -= oldDeductAmount;
              user.leaveBalance.casualLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Sick Leave') {
              user.leaveBalance.sickLeave.taken -= oldDeductAmount;
              user.leaveBalance.sickLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Restricted Holiday') {
              user.leaveBalance.restrictedLeave.taken -= oldDeductAmount;
              user.leaveBalance.restrictedLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Maternity Leave') {
              user.leaveBalance.maternityLeave.taken -= oldDeductAmount;
              user.leaveBalance.maternityLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Paternity Leave') {
              user.leaveBalance.paternityLeave.taken -= oldDeductAmount;
              user.leaveBalance.paternityLeave.available += oldDeductAmount;
            } else if (existingLeave.leaveType === 'Leave Without Pay') {
              user.leaveBalance.leaveWithoutPay.taken -= oldDeductAmount;
            } else if (existingLeave.leaveType === 'Compensatory Off') {
               const CompOffCredit = (await import('@/models/CompOffCredit')).default;
               const credit = await CompOffCredit.findOne({ usedAgainstLeave: existingLeave._id });
               if (credit) {
                 credit.isUsed = false;
                 credit.usedAgainstLeave = undefined;
                 await credit.save();
                 user.leaveBalance.compensatoryOff.taken -= oldDeductAmount;
                 user.leaveBalance.compensatoryOff.available += oldDeductAmount;
               }
            }
            user.markModified('leaveBalance');
            await user.save();
         }
      }

      // Upsert attendance record
      const attendance = await Attendance.findOneAndUpdate(
        { userId, date: attendanceDate },
        {
          $set: {
            status,
            loginTime: parsedLoginTime,
            logoutTime: parsedLogoutTime,
            totalHours,
            lateMinutes: status === 'late' ? 0 : 0 // simplify for manual override
          }
        },
        { new: true, upsert: true }
      );

      // Handle Comp-Off logic for manual override
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[attendanceDate.getDay()];
      const shift = user?.shiftId as any;
      const isWeeklyOff = shift && (!shift.workingDays || !shift.workingDays.includes(dayName));
      
      const Holiday = (await import('@/models/Holiday')).default;
      const holiday = await Holiday.findOne({
        date: attendanceDate,
        holidayType: { $in: ['public', 'company'] }
      });
      const isHoliday = !!holiday;

      if (isHoliday && ['present', 'half-day', 'late'].includes(status)) {
        return NextResponse.json({ error: `Cannot mark attendance on a ${holiday.holidayType === 'public' ? 'Public' : 'Company'} Holiday. It is a mandatory paid leave.` }, { status: 400 });
      }

      const CompOffCredit = (await import('@/models/CompOffCredit')).default;
      if (isWeeklyOff || isHoliday) {
        if (['present', 'half-day', 'late'].includes(status)) {
          // Grant Comp-Off if not already granted
          const existingCredit = await CompOffCredit.findOne({ employeeId: userId, attendanceDate });
          if (!existingCredit) {
             const expiry = new Date(attendanceDate);
             expiry.setMonth(expiry.getMonth() + 3);
             await CompOffCredit.create({
               employeeId: userId,
               attendanceDate,
               earnedDate: new Date(),
               availableFromDate: new Date(), // Available immediately
               expiryDate: expiry,
               companyId: user.companyId,
             });
          }
        } else {
          // If changed to absent, remove Comp-Off
          await CompOffCredit.findOneAndDelete({ employeeId: userId, attendanceDate });
        }
      } else {
        // If it's a regular working day, ensure no comp-off exists just in case
        await CompOffCredit.findOneAndDelete({ employeeId: userId, attendanceDate });
      }

      return NextResponse.json({ message: 'Attendance overridden successfully', attendance });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
