import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import LetterTemplate from '@/models/LetterTemplate';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const templates = await LetterTemplate.find().sort({ createdAt: -1 });
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await req.json();

    const template = await LetterTemplate.create({
      ...data,
      createdBy: session.user.id,
    });

    // Create Audit Log
    const LetterAuditLog = (await import('@/models/LetterAuditLog')).default;
    await LetterAuditLog.create({
      action: 'CREATED',
      performedBy: session.user.id,
      metadata: { templateId: template._id, type: 'LetterTemplate' },
    });

    return NextResponse.json({ template, message: 'Template created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
