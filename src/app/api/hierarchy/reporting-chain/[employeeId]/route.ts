import { NextResponse } from 'next/server';
import { HierarchyService } from '@/services/hierarchy.service';
import dbConnect from '@/lib/mongodb';

export async function GET(request: Request, { params }: { params: { employeeId: string } }) {
  try {
    await dbConnect();
    const chain = await HierarchyService.getReportingChain(params.employeeId);
    return NextResponse.json({ success: true, data: chain }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
