import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const { loginTime, logoutTime, status } = data; // Expected "HH:mm" or empty string

    await dbConnect();

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Parse time and apply to the existing date
    if (loginTime) {
      const [hours, minutes] = loginTime.split(':');
      const newLogin = new Date(attendance.date);
      newLogin.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      attendance.loginTime = newLogin;
    } else {
      attendance.loginTime = undefined;
    }

    if (logoutTime) {
      const [hours, minutes] = logoutTime.split(':');
      const newLogout = new Date(attendance.date);
      newLogout.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      attendance.logoutTime = newLogout;
    } else {
      attendance.logoutTime = undefined;
    }
    
    if (attendance.loginTime && attendance.logoutTime) {
      const diffMs = attendance.logoutTime.getTime() - attendance.loginTime.getTime();
      attendance.totalHours = diffMs / (1000 * 60 * 60);
    } else {
      attendance.totalHours = undefined;
    }

    attendance.status = status;
    await attendance.save();

    return NextResponse.json({ message: 'Attendance updated successfully', attendance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
