import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';
import LetterTemplate from '@/models/LetterTemplate';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Allow 'employee' to view their own letters
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Force model registration to prevent Next.js tree shaking from dropping them
    const models = [LetterTemplate, User, GeneratedLetter];
    
    const letters = await GeneratedLetter.find({ employeeId: session.user.id })
      .populate('templateId', 'templateName category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ letters }, { status: 200 });
  } catch (error: any) {
    console.error('API Error in /api/employee/letters:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
