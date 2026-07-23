import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';
import LetterTemplate from '@/models/LetterTemplate';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['super_admin', 'admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Force model registration to prevent Next.js tree shaking
    const models = [LetterTemplate, User, GeneratedLetter];

    const history = await GeneratedLetter.find()
      .populate('employeeId', 'name email employeeId designation department')
      .populate('templateId', 'templateName subject category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error: any) {
    console.error('API Error in /api/letters/history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
