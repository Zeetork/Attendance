import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Notification from '@/models/Notification';

export async function GET(req: Request) {
  try {
    // Basic auth check for cron jobs if needed
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    await dbConnect();
    
    const now = new Date();
    const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const [month, day, year] = istDateString.split('/');
    const today = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));

    const activeEmployees = await User.find({ isActive: true, role: { $ne: 'admin' } });
    
    let notifiedCount = 0;

    for (const employee of activeEmployees) {
      // Check if attendance exists for today
      const attendance = await Attendance.findOne({
        userId: employee._id,
        date: { $gte: today }
      });

      if (!attendance) {
        // Employee has not checked in
        // Send notification to Admin and Reporting Manager
        const admin = await User.findOne({ role: 'admin' });
        
        if (admin) {
          await Notification.create({
            recipientId: admin._id,
            type: 'ATTENDANCE_ALERT',
            message: `Employee ${employee.name} has not checked in today.`,
            link: '/admin/attendance',
          });
        }

        if (employee.reportsTo) {
          await Notification.create({
            recipientId: employee.reportsTo,
            type: 'ATTENDANCE_ALERT',
            message: `Team member ${employee.name} has not checked in today.`,
            link: '/admin/attendance', // They might view their team's attendance here
          });
        }
        
        notifiedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Processed ${notifiedCount} absent employees.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
