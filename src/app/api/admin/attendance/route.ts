import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Shift from '@/models/Shift';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const dateStr = searchParams.get('date');
    const status = searchParams.get('status');
    const shift = searchParams.get('shift');

    const query: any = {};

    if (dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: date, $lt: nextDate };
    }

    if (status) {
      query.status = status;
    }

    // Match search and shift via user
    let userQuery: any = {};
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    if (shift) {
      userQuery.shiftId = shift;
    }

    let matchingUserIds: any[] = [];
    if (Object.keys(userQuery).length > 0) {
      const users = await User.find(userQuery).select('_id');
      matchingUserIds = users.map(u => u._id);
      query.userId = { $in: matchingUserIds };
    }

    const total = await Attendance.countDocuments(query);
    const attendances = await Attendance.find(query)
      .populate({
        path: 'userId',
        select: 'name employeeId profileImage shiftId',
        populate: {
          path: 'shiftId',
          model: 'Shift',
          select: 'shiftName workingDays'
        }
      })
      .sort({ date: -1, loginTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}
