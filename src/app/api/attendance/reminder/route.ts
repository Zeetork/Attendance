import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Notification from '@/models/Notification';
import { sendWebPushNotification } from '@/lib/sendWebPushNotification';
import mongoose from 'mongoose';

// Helper to determine today's date range in IST
function getTodayISTDateRange() {
  const now = new Date();
  const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const [month, day, year] = istDateString.split('/');

  const todayStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
  const formattedDate = new Date(todayStart).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  return { todayStart, todayEnd, formattedDate };
}

// Helper to process attendance reminders for a given type ('check-in' or 'check-out')
async function processReminders({
  type,
  companyId,
}: {
  type: 'check-in' | 'check-out';
  companyId?: string | null;
}) {
  const { todayStart, todayEnd, formattedDate } = getTodayISTDateRange();

  // Build user query - include all active staff and employees
  const query: any = {
    isActive: true,
  };

  if (companyId) {
    query.companyId = new mongoose.Types.ObjectId(companyId);
  }

  const activeEmployees = await User.find(query, null, { bypassTenant: true }).lean();

  const remindersSent: string[] = [];
  let pushCount = 0;
  let inAppCount = 0;

  for (const employee of activeEmployees) {
    // 1. Check if employee has an approved leave today
    const activeLeave = await Leave.findOne(
      {
        userId: employee._id,
        status: 'approved',
        fromDate: { $lte: todayEnd },
        toDate: { $gte: todayStart },
      },
      null,
      { bypassTenant: true }
    );

    if (activeLeave) {
      continue; // Skip employee on leave
    }

    // 2. Check today's attendance record
    const todayAttendance = await Attendance.findOne(
      {
        userId: employee._id,
        date: { $gte: todayStart, $lte: todayEnd },
      },
      null,
      { bypassTenant: true }
    );

    let shouldSend = false;
    let title = '';
    let body = '';

    if (type === 'check-in') {
      // Has not checked in yet
      if (!todayAttendance || !todayAttendance.loginTime) {
        shouldSend = true;
        title = 'Action Required: Daily Attendance Check-In Reminder';
        body = `Hi ${employee.name}, please remember to mark your check-in attendance for today (${formattedDate}).`;
      }
    } else if (type === 'check-out') {
      // Checked in, but hasn't checked out yet
      if (todayAttendance && todayAttendance.loginTime && !todayAttendance.logoutTime) {
        shouldSend = true;
        title = 'Action Required: Daily Attendance Check-Out Reminder';
        body = `Hi ${employee.name}, please remember to check out before leaving to ensure your work hours are tracked.`;
      }
    }

    if (!shouldSend) continue;

    remindersSent.push(employee.name);

    // a. Send Web Push Notification via Firebase Cloud Messaging
    try {
      const pushRes = await sendWebPushNotification(employee._id.toString(), {
        title,
        body,
        data: {
          url: '/employee/attendance',
          type: `reminder_${type}`,
        },
      });
      if (pushRes.sent > 0) {
        pushCount += pushRes.sent;
      }
    } catch (pushErr) {
      console.error(`Failed to send web push reminder to ${employee.email || employee.name}:`, pushErr);
    }

    // b. Create In-App Notification (shows under bell icon)
    try {
      await Notification.create({
        companyId: employee.companyId || undefined,
        recipientId: employee._id,
        type: `attendance_reminder_${type}`,
        message: body,
        isRead: false,
        link: '/employee/attendance',
      });
      inAppCount++;
    } catch (notifErr) {
      console.warn(`Failed to create in-app notification record for ${employee.name}:`, notifErr);
    }
  }

  return {
    evaluatedCount: activeEmployees.length,
    remindersSent,
    pushCount,
    inAppCount,
  };
}

// GET handler for scheduled CRON triggers (e.g. from Vercel Cron or GitHub Actions)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') === 'check-out' ? 'check-out' : 'check-in';

    await dbConnect();
    const result = await processReminders({ type: typeParam });

    return NextResponse.json(
      {
        success: true,
        type: typeParam,
        message: `${typeParam === 'check-in' ? 'Check-In' : 'Check-Out'} push reminders processed for ${result.remindersSent.length} employees (Push: ${result.pushCount}, In-App: ${result.inAppCount}).`,
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('CRON Error [Attendance Reminder]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST handler for manual Admin trigger from Dashboard
export async function POST(req: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || !['admin', 'super_admin', 'company_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await req.json();
    if (!['check-in', 'check-out'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reminder type. Must be check-in or check-out.' }, { status: 400 });
    }

    await dbConnect();

    // If company admin, only send to their company
    const companyId = role === 'company_admin' ? (session.user as any).companyId : null;
    const result = await processReminders({ type, companyId });

    return NextResponse.json(
      {
        success: true,
        type,
        message: `${type === 'check-in' ? 'Check-In' : 'Check-Out'} reminders processed for ${result.remindersSent.length} employee(s). Push notifications: ${result.pushCount}.`,
        sentTo: result.remindersSent,
        pushCount: result.pushCount,
        inAppCount: result.inAppCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Error [Attendance Reminder POST]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
