import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Permission from '@/models/Permission';
import Attendance from '@/models/Attendance';
import PermissionCompensation from '@/models/PermissionCompensation';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { attendanceId, usedMinutes } = await req.json();
    if (!attendanceId || !usedMinutes || usedMinutes <= 0) {
      return Response.json({ error: 'Invalid compensation payload' }, { status: 400 });
    }

    await dbConnect();

    // Validate Permission
    const { id } = await props.params;
    const permission = await Permission.findOne({ _id: id, userId: session.user.id }).session(dbSession);
    if (!permission) throw new Error('Permission not found');
    
    if (!['Pending Compensation', 'Partially Compensated'].includes(permission.status)) {
      throw new Error('Permission is not in a valid state for compensation');
    }

    if (usedMinutes > permission.pendingMinutes) {
      throw new Error('Used minutes exceeds pending permission minutes');
    }

    // Validate Attendance
    const attendance = await Attendance.findOne({ _id: attendanceId, userId: session.user.id }).session(dbSession);
    if (!attendance) throw new Error('Attendance not found');

    if (attendance.availableExtraMinutes! < usedMinutes) {
      throw new Error('Attendance does not have enough available extra minutes');
    }

    // Month validation
    const permDate = new Date(permission.date);
    const attDate = new Date(attendance.date);
    if (permDate.getMonth() !== attDate.getMonth() || permDate.getFullYear() !== attDate.getFullYear()) {
      throw new Error('Permission compensation must be completed within the same calendar month');
    }

    // Perform Compensation
    await PermissionCompensation.create([{
      permissionId: permission._id,
      attendanceId: attendance._id,
      usedMinutes,
      createdBy: session.user.id as any
    }], { session: dbSession });

    // Update Attendance
    attendance.availableExtraMinutes! -= usedMinutes;
    await attendance.save({ session: dbSession });

    // Update Permission
    permission.pendingMinutes -= usedMinutes;
    permission.compensatedMinutes += usedMinutes;
    
    if (permission.pendingMinutes === 0) {
      permission.status = 'Fully Compensated';
      
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create([{
        recipientId: session.user.id,
        type: 'PERMISSION_FULLY_COMPENSATED',
        message: `Your permission for ${permDate.toLocaleDateString()} has been fully compensated.`,
        link: '/employee/permissions',
        companyId: session.user.companyId
      }], { session: dbSession });
    } else {
      permission.status = 'Partially Compensated';
    }
    
    await permission.save({ session: dbSession });

    await dbSession.commitTransaction();
    dbSession.endSession();

    return Response.json({ message: 'Compensation recorded successfully', permission }, { status: 200 });
  } catch (error: any) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    return Response.json({ error: error.message }, { status: 400 });
  }
}
