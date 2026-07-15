import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Permission from '@/models/Permission';
import PermissionBalance from '@/models/PermissionBalance';
import PermissionCompensation from '@/models/PermissionCompensation';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    await dbConnect();
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // 1. Permission Report (Allowed, Used, Remaining, Pending, Compensated)
    const balances = await PermissionBalance.find({ year, month }).populate('userId', 'name employeeId').lean();
    const permissions = await Permission.find({ date: { $gte: startDate, $lte: endDate } }).populate('userId', 'name employeeId').lean();
    
    const permissionReport = balances.map((b: any) => {
      const userPerms = permissions.filter((p: any) => p.userId._id.toString() === b.userId._id.toString());
      const pending = userPerms.filter((p: any) => p.status === 'Pending Compensation' || p.status === 'Partially Compensated').reduce((acc: number, curr: any) => acc + curr.pendingMinutes, 0);
      const compensated = userPerms.reduce((acc: number, curr: any) => acc + curr.compensatedMinutes, 0);
      return {
        employee: b.userId.name,
        employeeId: b.userId.employeeId,
        allowed: b.allowedMinutes,
        used: b.usedMinutes,
        remaining: b.remainingMinutes,
        pending,
        compensated
      };
    });

    // 2. Pending Compensation Report
    const pendingReport = permissions
      .filter((p: any) => p.status === 'Pending Compensation' || p.status === 'Partially Compensated')
      .map((p: any) => {
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
        return {
          employee: p.userId.name,
          employeeId: p.userId.employeeId,
          permissionDate: p.date,
          duration: p.duration,
          pendingMinutes: p.pendingMinutes,
          daysRemaining,
          status: p.status
        };
      });

    // 3. Compensation Audit Report
    const compensations = await PermissionCompensation.find()
      .populate({
        path: 'permissionId',
        match: { date: { $gte: startDate, $lte: endDate } },
        populate: { path: 'userId', select: 'name employeeId' }
      })
      .populate('attendanceId', 'date')
      .lean();

    const auditReport = compensations
      .filter((c: any) => c.permissionId)
      .map((c: any) => ({
        employee: c.permissionId.userId.name,
        employeeId: c.permissionId.userId.employeeId,
        permissionDate: c.permissionId.date,
        attendanceDate: c.attendanceId?.date,
        permissionMinutes: c.permissionId.duration,
        usedMinutes: c.usedMinutes,
        verified: true // Assuming mapped compensations are verified since they use verified attendance
      }));

    return Response.json({ permissionReport, pendingReport, auditReport }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
