import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';
import { generatePDF } from '@/lib/pdfService';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // In Next.js 15+, params is a Promise in Route Handlers
    const { id } = await params;
    const letter = await GeneratedLetter.findById(id).populate('employeeId', 'name');
    
    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    // Cast employeeId to any since it's populated but typed as ObjectId
    const employee = letter.employeeId as any;

    // Check permissions
    const isAdmin = ['super_admin', 'admin', 'director', 'hr'].includes(session.user.role as string);
    const isOwner = employee._id.toString() === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!letter.content) {
      return NextResponse.json({ error: 'No content found for this letter' }, { status: 400 });
    }

    const pdfBuffer = await generatePDF(letter.content);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="Letter_${employee.name?.replace(/\\s+/g, '_') || 'Employee'}.pdf"`);

    // Convert Buffer to Uint8Array to satisfy NextResponse BodyInit types
    return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers });
  } catch (error: any) {
    console.error('PDF download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
