import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    await dbConnect();

    const holiday = await Holiday.findByIdAndUpdate(id, data, { new: true });
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holiday updated successfully', holiday });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
