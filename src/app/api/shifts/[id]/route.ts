import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Shift from '@/models/Shift';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftName, startTime, endTime, graceTime, workingDays, isActive } = await req.json();

    await dbConnect();
    const { id } = await props.params;
    
    const shift = await Shift.findByIdAndUpdate(
      id,
      { shiftName, startTime, endTime, graceTime, workingDays, isActive },
      { new: true }
    );

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shift updated successfully', shift });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await props.params;
    
    const shift = await Shift.findByIdAndDelete(id);

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
