import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (!['admin', 'super_admin'].includes(session.user.role) && session.user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const companies = await Company.find().sort({ createdAt: -1 });
    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (!['admin', 'super_admin'].includes(session.user.role) && session.user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();
    const company = await Company.create(data);
    return NextResponse.json({ company }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
