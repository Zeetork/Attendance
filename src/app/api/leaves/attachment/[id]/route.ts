import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { downloadFileFromWorkDrive } from '@/lib/zohoWorkdrive';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing attachment ID' }, { status: 400 });
    }

    const isDownload = req.nextUrl.searchParams.get('download') === 'true';

    const { data, contentType, filename } = await downloadFileFromWorkDrive(id);

    // Sanitize filename for header
    const cleanFilename = filename.replace(/[/\\]/g, '-');
    const disposition = isDownload ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`,
        'Content-Length': data.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error serving medical certificate attachment:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to download attachment from Zoho WorkDrive' },
      { status: 500 }
    );
  }
}
