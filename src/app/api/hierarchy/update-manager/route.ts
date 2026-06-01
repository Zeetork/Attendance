import { NextResponse } from 'next/server';
import { HierarchyService } from '@/services/hierarchy.service';
import dbConnect from '@/lib/mongodb';

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { employeeId, reportsTo } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }

    const updatedEmployee = await HierarchyService.updateManager(employeeId, reportsTo);
    return NextResponse.json({ success: true, data: updatedEmployee }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
