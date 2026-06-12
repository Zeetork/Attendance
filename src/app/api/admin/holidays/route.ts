import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
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
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json({ holidays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();

    const holiday = await Holiday.create({
      ...data,
      createdBy: session.user.id
    });

    return NextResponse.json({ message: 'Holiday created', holiday }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
