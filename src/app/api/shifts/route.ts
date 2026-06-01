import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    let shifts = await Shift.find({ isActive: true });
    
    if (shifts.length === 0) {
      await Shift.create([
        { shiftName: 'Shift A', startTime: '07:30', endTime: '16:30', graceTime: 15 },
        { shiftName: 'Shift B', startTime: '09:00', endTime: '18:00', graceTime: 15 }
      ]);
      shifts = await Shift.find({ isActive: true });
    }
    return NextResponse.json({ shifts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}
