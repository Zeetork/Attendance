import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import MissPunch from '@/models/MissPunch';
import AttendanceCorrection from '@/models/AttendanceCorrection';
import OvertimeRequest from '@/models/OvertimeRequest';
import WFHRequest from '@/models/WFHRequest';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Fetch all pending requests
    const [
      leaves,
      missPunches,
      attendanceCorrections,
      overtimes,
      wfhs
    ] = await Promise.all([
      Leave.find({ status: 'pending' }).populate('userId', 'name employeeId').lean(),
      MissPunch.find({ status: 'pending' }).populate('employeeId', 'name employeeId').lean(),
      AttendanceCorrection.find({ status: 'pending' }).populate('employeeId', 'name employeeId').lean(),
      OvertimeRequest.find({ status: 'pending' }).populate('employeeId', 'name employeeId').lean(),
      WFHRequest.find({ status: 'pending' }).populate('employeeId', 'name employeeId').lean(),
    ]);

    // Normalize data structure for UI
    const approvals = [
      ...leaves.map(l => ({ ...l, _id: l._id?.toString(), requestType: 'LEAVE', employee: l.userId })),
      ...missPunches.map(m => ({ ...m, _id: m._id?.toString(), requestType: 'MISS_PUNCH', subType: m.requestType, employee: m.employeeId })),
      ...attendanceCorrections.map(a => ({ ...a, _id: a._id?.toString(), requestType: 'ATTENDANCE_CORRECTION', employee: a.employeeId })),
      ...overtimes.map(o => ({ ...o, _id: o._id?.toString(), requestType: 'OVERTIME', employee: o.employeeId })),
      ...wfhs.map(w => ({ ...w, _id: w._id?.toString(), requestType: 'WFH', employee: w.employeeId })),
    ];

    // Sort approvals by created date if needed, though they might not have createdAt universally, assuming they do
    approvals.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ approvals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
