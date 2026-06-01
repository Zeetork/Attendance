import { NextResponse } from 'next/server';
import { HierarchyService } from '@/services/hierarchy.service';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    const tree = await HierarchyService.getOrganizationTree();
    return NextResponse.json({ success: true, data: tree }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
