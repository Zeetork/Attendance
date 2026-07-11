import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import { sendEmail } from '@/lib/emailService';

export async function GET(req: Request) {
  try {
    // 1. Secure the endpoint with CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 2. Get today's date based on India Standard Time (IST)
    const now = new Date();
    const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const [month, day, year] = istDateString.split('/');
    
    // Exact UTC representation of IST midnight (to accurately query the DB)
    const todayStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));

    // 3. Fetch all active employees
    const activeEmployees = await User.find({ 
      isActive: true, 
      role: { $ne: 'admin' },
      email: { $exists: true, $ne: '' } 
    }).lean();

    const remindersSent: string[] = [];

    for (const employee of activeEmployees) {
      // a. Check if employee has an approved leave for today
      const activeLeave = await Leave.findOne({
        userId: employee._id,
        status: 'approved',
        fromDate: { $lte: todayEnd },
        toDate: { $gte: todayStart }
      });

      if (activeLeave) {
        continue; // Skip employee on leave
      }

      // b. Check if employee has already checked in today
      const todayAttendance = await Attendance.findOne({
        userId: employee._id,
        date: { $gte: todayStart, $lte: todayEnd }
      });

      if (todayAttendance) {
        continue; // Skip employee who already checked in
      }

      // c. Send reminder email for those who forgot
      const formattedDate = new Date(todayStart).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' 
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Attendance Reminder</h2>
          <p>Hi <strong>${employee.name}</strong>,</p>
          <p>We noticed that you haven't checked in for today, <strong>${formattedDate}</strong>.</p>
          <p>Please log into the HRMS Portal and mark your attendance to ensure your work hours are accurately tracked.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://attendance-truflow.vercel.app'}/login" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Go to HRMS Portal
            </a>
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
            If you are on an unplanned leave or facing technical issues, please notify your manager.
          </p>
        </div>
      `;

      try {
        await sendEmail({
          to: employee.email,
          subject: 'Action Required: Daily Attendance Reminder',
          html: emailHtml
        });
        remindersSent.push(employee.name);
      } catch (emailError) {
        console.error(`Failed to send reminder email to ${employee.email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Reminders successfully processed. Emails sent: ${remindersSent.length}`,
      sentTo: remindersSent
    }, { status: 200 });

  } catch (error: any) {
    console.error('CRON Error [Attendance Reminder]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
