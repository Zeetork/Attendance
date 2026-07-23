import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Allow 'employee' to view their own letters
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const letters = await GeneratedLetter.find({ employeeId: session.user.id })
      .populate('templateId', 'templateName category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ letters }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
