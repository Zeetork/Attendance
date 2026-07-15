import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (!year || !month) {
      return Response.json({ error: 'Year and month required' }, { status: 400 });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    await dbConnect();
    
    // Only fetch attendances that are completed and have available extra minutes > 0
    // "Attendance is completed" means all sessions checkOut exists, or status='present' etc.
    // For simplicity, we just check availableExtraMinutes > 0
    const attendances = await Attendance.find({
      userId: session.user.id,
      date: { $gte: startDate, $lte: endDate },
      availableExtraMinutes: { $gt: 0 },
      // Optional: check if session is completed, we assume it's completed if checkout calculated extra minutes.
    }).sort({ date: 1 }).lean();

    return Response.json({ attendances }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
