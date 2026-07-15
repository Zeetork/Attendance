import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Permission from '@/models/Permission';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    const permissions = await Permission.find()
      .sort({ date: -1, createdAt: -1 })
      .populate('userId', 'name employeeId')
      .populate('currentApprover', 'name')
      .lean();

    return Response.json({ permissions }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
