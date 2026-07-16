import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Permission from '@/models/Permission';
import Attendance from '@/models/Attendance';
import PermissionCompensation from '@/models/PermissionCompensation';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { compensations } = await req.json(); // Array of { attendanceId, usedMinutes }
    if (!compensations || !Array.isArray(compensations) || compensations.length === 0) {
      return Response.json({ error: 'Invalid compensation payload' }, { status: 400 });
    }

    await dbConnect();

    // Validate Permission
    const { id } = await props.params;
    const permission = await Permission.findOne({ _id: id, userId: session.user.id });
    if (!permission) throw new Error('Permission not found');
    
    if (!['Pending Compensation', 'Partially Compensated'].includes(permission.status)) {
      throw new Error('Permission is not in a valid state for compensation');
    }

    let totalUsedMinutes = 0;
    
    // Validate total used against permission pending
    for (const comp of compensations) {
      totalUsedMinutes += comp.usedMinutes;
    }
    
    if (totalUsedMinutes > permission.pendingMinutes) {
      throw new Error('Total used minutes exceeds pending permission minutes');
    }

    const permDate = new Date(permission.date);
    
    // Process each compensation
    for (const comp of compensations) {
      const attendance = await Attendance.findOne({ _id: comp.attendanceId, userId: session.user.id });
      if (!attendance) throw new Error(`Attendance ${comp.attendanceId} not found`);

      if (attendance.availableExtraMinutes! < comp.usedMinutes) {
        throw new Error(`Attendance ${comp.attendanceId} does not have enough available extra minutes`);
      }

      const attDate = new Date(attendance.date);
      if (permDate.getMonth() !== attDate.getMonth() || permDate.getFullYear() !== attDate.getFullYear()) {
        throw new Error('Permission compensation must be completed within the same calendar month');
      }

      // Perform Compensation
      await PermissionCompensation.create({
        permissionId: permission._id,
        attendanceId: attendance._id,
        usedMinutes: comp.usedMinutes,
        createdBy: session.user.id as any
      });

      // Update Attendance
      attendance.availableExtraMinutes! -= comp.usedMinutes;
      await attendance.save();
    }

    // Update Permission
    permission.pendingMinutes -= totalUsedMinutes;
    permission.compensatedMinutes += totalUsedMinutes;
    
    if (permission.pendingMinutes === 0) {
      permission.status = 'Fully Compensated';
      
      await Notification.create({
        recipientId: session.user.id,
        type: 'PERMISSION_FULLY_COMPENSATED',
        message: `Your permission for ${permDate.toLocaleDateString()} has been fully compensated.`,
        link: '/employee/permissions',
        companyId: session.user.companyId
      });
    } else {
      permission.status = 'Partially Compensated';
    }
    
    await permission.save();

    return Response.json({ message: 'Compensation recorded successfully', permission }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
