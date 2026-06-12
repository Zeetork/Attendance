import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import LetterEmailLog from '@/models/LetterEmailLog';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const logs = await LetterEmailLog.find()
      .populate('employeeId', 'name email employeeId')
      .populate('templateId', 'templateName category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
