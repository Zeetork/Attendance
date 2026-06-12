import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = session.user;
    
    let companies = [];
    if (user.role === 'super_admin' || user.role === 'admin') {
      companies = await Company.find({ status: true }).lean();
    } else if (user.companyIds && user.companyIds.length > 0) {
      companies = await Company.find({ _id: { $in: user.companyIds }, status: true }).lean();
    } else if (user.companyId) {
      companies = await Company.find({ _id: user.companyId, status: true }).lean();
    }

    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
