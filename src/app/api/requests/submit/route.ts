import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import MissPunch from '@/models/MissPunch';
import AttendanceCorrection from '@/models/AttendanceCorrection';
import OvertimeRequest from '@/models/OvertimeRequest';
import WFHRequest from '@/models/WFHRequest';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestType, ...data } = await req.json();

    await dbConnect();
    const user = await User.findById(session.user.id);
    let approverId = user?.reportsTo;

    if (!approverId) {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) approverId = admin._id;
    }

    if (!approverId) {
      return NextResponse.json({ error: 'No approver found' }, { status: 400 });
    }

    let request;
    let notificationMsg = '';

    switch (requestType) {
      case 'MISS_PUNCH':
        request = await MissPunch.create({ ...data, requestType: data.requestTypeSubType, employeeId: session.user.id, approverId, status: 'pending' });
        notificationMsg = `${user?.name} has submitted a Miss Punch request.`;
        break;
      case 'ATTENDANCE_CORRECTION':
        request = await AttendanceCorrection.create({ ...data, employeeId: session.user.id, approverId, status: 'pending' });
        notificationMsg = `${user?.name} has submitted an Attendance Correction request.`;
        break;
      case 'OVERTIME':
        request = await OvertimeRequest.create({ ...data, employeeId: session.user.id, approverId, status: 'pending' });
        notificationMsg = `${user?.name} has submitted an Overtime request.`;
        break;
      case 'WFH':
        request = await WFHRequest.create({ ...data, employeeId: session.user.id, approverId, status: 'pending' });
        notificationMsg = `${user?.name} has submitted a WFH request.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid requestType' }, { status: 400 });
    }

    if (approverId) {
      await Notification.create({
        recipientId: approverId,
        type: `${requestType}_REQUEST`,
        message: notificationMsg,
        link: '/employee/approvals',
      });
    }

    return NextResponse.json({ message: 'Request submitted successfully', request }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
