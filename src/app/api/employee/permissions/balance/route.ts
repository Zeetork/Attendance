import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import PermissionBalance from '@/models/PermissionBalance';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    await dbConnect();

    let balance = await PermissionBalance.findOne({
      userId: session.user.id,
      year,
      month
    });

    if (!balance) {
      // Auto-create balance for the month if it doesn't exist
      balance = await PermissionBalance.create({
        companyId: session.user.companyId,
        userId: session.user.id,
        year,
        month,
        allowedMinutes: 120,
        usedMinutes: 0,
        remainingMinutes: 120
      });
    }

    return Response.json({ balance }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
