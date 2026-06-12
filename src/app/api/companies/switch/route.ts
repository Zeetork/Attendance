import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import SystemAuditLog from '@/models/SystemAuditLog';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Validate access
    const user = session.user;
    const hasAccess = user.role === 'super_admin' || user.role === 'admin' || (user.companyIds && user.companyIds.includes(companyId));
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    if (user.id) {
      await SystemAuditLog.create({
        userId: user.id,
        companyId: companyId,
        action: 'COMPANY_SWITCH'
      });
    } else {
      console.warn('COMPANY_SWITCH: User ID is missing in session, skipping audit log.');
    }

    // Create a new response
    const response = NextResponse.json({ message: 'Company switched successfully' });
    
    // Set cookie
    response.cookies.set({
      name: 'activeCompanyId',
      value: companyId,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Error switching company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
