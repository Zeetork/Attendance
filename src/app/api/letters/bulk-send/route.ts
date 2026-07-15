import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { processBulkLetters } from '@/lib/bulkEmailService';
import LetterTemplate from '@/models/LetterTemplate';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['super_admin', 'admin', 'director', 'hr'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await req.json();
    const { templateId, employeesData } = data;

    if (!templateId || !employeesData || !Array.isArray(employeesData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const template = await LetterTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Call background or sync bulk process
    // In a real production system, this should probably be sent to a queue
    // For now, we await it
    const results = await processBulkLetters({
      templateId,
      templateSubject: template.subject,
      employeesData,
      generatedById: session.user.id,
    });

    const LetterAuditLog = (await import('@/models/LetterAuditLog')).default;
    await LetterAuditLog.create({
      action: 'SENT',
      performedBy: session.user.id,
      metadata: { templateId, type: 'BulkSend', count: employeesData.length },
    });

    return NextResponse.json({ message: 'Bulk letters processed', results }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
