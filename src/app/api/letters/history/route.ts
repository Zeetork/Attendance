import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const history = await GeneratedLetter.find()
      .populate('employeeId', 'name email employeeId designation department')
      .populate('templateId', 'templateName subject category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
