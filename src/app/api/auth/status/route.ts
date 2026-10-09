import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { authenticated: false, active: false, reason: 'unauthenticated' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.user.id, null, { bypassTenant: true }).select('isActive role');

    if (!user || user.isActive === false) {
      // User is inactive or was deleted - invalidate cookies immediately
      const cookieStore = await cookies();
      cookieStore.delete('authjs.session-token');
      cookieStore.delete('__Secure-authjs.session-token');
      cookieStore.delete('next-auth.session-token');
      cookieStore.delete('__Secure-next-auth.session-token');
      cookieStore.delete('activeCompanyId');

      return NextResponse.json(
        { authenticated: true, active: false, reason: 'inactive' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      active: true,
      role: user.role,
    });
  } catch (error: any) {
    console.error('[auth-status] Error checking user status:', error);
    return NextResponse.json(
      { authenticated: false, active: true, error: error.message },
      { status: 500 }
    );
  }
}
