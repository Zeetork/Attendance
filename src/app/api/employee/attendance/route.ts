import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import AttendanceCorrection from '@/models/AttendanceCorrection';
import MissPunch from '@/models/MissPunch';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    await dbConnect();

    let query: any = { userId: session.user.id };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(query).sort({ date: -1 }).lean();

    const corrections = await AttendanceCorrection.find({ employeeId: session.user.id }).sort({ createdAt: -1 }).lean();
    const missPunches = await MissPunch.find({ employeeId: session.user.id }).sort({ createdAt: -1 }).lean();

    const attendancesWithStatus = attendances.map((att: any) => {
      const correction = corrections.find((c: any) => c.attendanceId?.toString() === att._id.toString());
      const missPunch = missPunches.find((m: any) => {
        if (!m.date || !att.date) return false;
        return new Date(m.date).toISOString().split('T')[0] === new Date(att.date).toISOString().split('T')[0];
      });

      const request = correction || missPunch;

      return {
        ...att,
        correctionStatus: request ? request.status : null,
        correctionType: request ? (correction ? 'Attendance Correction' : 'Miss Punch') : null
      };
    });

    return NextResponse.json({ attendances: attendancesWithStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
