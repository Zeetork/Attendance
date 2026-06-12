import { NextResponse } from 'next/server';
import { HierarchyService } from '@/services/hierarchy.service';
import dbConnect from '@/lib/mongodb';

export async function GET(request: Request, { params }: { params: Promise<{ managerId: string }> }) {
  try {
    const { managerId } = await params;
    await dbConnect();
    const team = await HierarchyService.getTeamMembers(managerId);
    return NextResponse.json({ success: true, data: team }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}