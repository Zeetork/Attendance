import { NextRequest, NextResponse } from 'next/server';
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
        { 
          shiftName: 'General Shift', 
          startTime: '07:30', 
          endTime: '16:30', 
          graceTime: 15,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        { 
          shiftName: 'Regular Shift', 
          startTime: '09:00', 
          endTime: '18:00', 
          graceTime: 15,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        }
      ]);
      shifts = await Shift.find({ isActive: true });
    }
    return NextResponse.json({ shifts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftName, startTime, endTime, graceTime, workingDays } = await req.json();

    if (!shiftName || !startTime || !endTime || !workingDays || workingDays.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    const shift = await Shift.create({
      shiftName,
      startTime,
      endTime,
      graceTime: graceTime || 0,
      workingDays
    });

    return NextResponse.json({ message: 'Shift created successfully', shift }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
