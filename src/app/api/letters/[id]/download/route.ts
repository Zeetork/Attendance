import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

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

    // Instead of generating a PDF on the server (which causes issues on serverless deployments like Vercel),
    // we return an HTML page that automatically triggers the browser's native print-to-PDF functionality.
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Letter - ${employee.name || 'Employee'}</title>
          <style>
            @font-face {
              font-family: "Allura";
              src: url("/font/Allura/Allura-Regular.ttf") format("truetype");
            }
            body {
              background-color: #ffffff;
              font-size: 16px;
              text-align: justify;
              font-family: Helvetica, Arial, sans-serif;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            @media print {
              @page {
                size: A4;
                margin: 0; /* Removing page margin hides the browser's default header/footer (date, URL, etc.) */
              }
            }
            div {
              padding-top: 20px;
              padding-right: 20px;
            }
          </style>
        </head>
        <body onload="setTimeout(() => window.print(), 500)">
          ${letter.content}
        </body>
      </html>
    `;

    const headers = new Headers();
    headers.set('Content-Type', 'text/html');

    return new NextResponse(html, { status: 200, headers });
  } catch (error: any) {
    console.error('PDF display error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
