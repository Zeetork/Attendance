import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    await dbConnect();

    let query: any = {};
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      query.date = { $gte: start, $lte: end };
    } else {
      // If no year, get upcoming holidays
      const now = new Date();
      const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
      const [monthStr, dayStr, currentYearStr] = istDateString.split('/');
      const today = new Date(Date.UTC(parseInt(currentYearStr), parseInt(monthStr) - 1, parseInt(dayStr), 0, 0, 0, 0));
      query.date = { $gte: today };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json({ holidays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
