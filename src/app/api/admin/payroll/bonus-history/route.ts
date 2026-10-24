import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import BonusHistory from '@/models/BonusHistory';
import User from '@/models/User';
import { getSalaryForPayrollPeriod } from '@/lib/salaryUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['super_admin', 'company_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const cookieStore = await cookies();
    const activeCompanyId = cookieStore.get('activeCompanyId')?.value || session.user.companyId;

    const { searchParams } = new URL(req.url);
    const fetchEmployees = searchParams.get('fetchEmployees') === 'true';
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    // Mode 1: Fetch active employees with calculated default bonus (50% of Basic Pay)
    if (fetchEmployees) {
      const targetMonth = month || (new Date().getMonth() + 1);
      const targetYear = year || new Date().getFullYear();

      const userQuery: any = {
        role: { $ne: 'admin' },
        isActive: true
      };

      if (activeCompanyId) {
        userQuery.$or = [
          { companyId: activeCompanyId },
          { companyIds: activeCompanyId }
        ];
      }

      const users = await User.find(userQuery)
        .select('name employeeId role department designation monthlySalary salaryTimelines joiningDate companyId')
        .sort({ name: 1 })
        .lean();

      // Check if existing record exists for this month & year
      const bonusQuery: any = { month: targetMonth, year: targetYear };
      if (activeCompanyId) bonusQuery.companyId = activeCompanyId;
      const existingRecord = await BonusHistory.findOne(bonusQuery).lean();

      const existingEmployeesMap = new Map<string, any>();
      if (existingRecord && existingRecord.employees) {
        existingRecord.employees.forEach((emp: any) => {
          existingEmployeesMap.set(emp.userId?.toString() || emp.employeeId, emp);
        });
      }

      const employees = users.map((user: any) => {
        const salaryInfo = getSalaryForPayrollPeriod(user, targetMonth, targetYear);
        const monthlySalary = salaryInfo?.monthlySalary || user.monthlySalary || 0;
        const timeline = salaryInfo?.timeline as any;
        const basicSalary = timeline?.basicSalary ?? Math.round(monthlySalary * 0.5);

        // Default bonus = 0 (admin can use 50% / 100% Total Salary quick-fill buttons)
        const defaultBonus = 0;

        // If an existing record was saved previously, preserve the saved bonusAmount
        const existingEmp = existingEmployeesMap.get(user._id.toString()) || existingEmployeesMap.get(user.employeeId);
        const bonusAmount = existingEmp ? existingEmp.bonusAmount : defaultBonus;
        const remarks = existingEmp?.remarks || '';

        return {
          userId: user._id.toString(),
          employeeId: user.employeeId,
          name: user.name,
          department: user.department || 'N/A',
          designation: user.designation || user.role,
          monthlySalary,
          basicSalary,
          bonusAmount,
          remarks
        };
      });

      return NextResponse.json({
        employees,
        existingRecord: existingRecord || null
      }, { status: 200 });
    }

    // Mode 2: Fetch specific month & year record
    if (month && year) {
      const query: any = { month, year };
      if (activeCompanyId) query.companyId = activeCompanyId;
      const record = await BonusHistory.findOne(query).lean();
      return NextResponse.json({ bonusHistory: record || null }, { status: 200 });
    }

    // Mode 3: Fetch list of all bonus history entries
    const query: any = {};
    if (activeCompanyId) query.companyId = activeCompanyId;
    const bonusHistories = await BonusHistory.find(query)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ bonusHistories }, { status: 200 });
  } catch (error: any) {
    console.error('BonusHistory GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch bonus history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['super_admin', 'company_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const cookieStore = await cookies();
    const activeCompanyId = cookieStore.get('activeCompanyId')?.value || session.user.companyId;

    const body = await req.json();
    const { id, title, month, year, employees, notes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Bonus title is required (e.g., Diwali Bonus 2026)' }, { status: 400 });
    }

    const mNum = Number(month);
    const yNum = Number(year);

    if (!mNum || mNum < 1 || mNum > 12) {
      return NextResponse.json({ error: 'Valid month (1-12) is required' }, { status: 400 });
    }

    if (!yNum || yNum < 2000 || yNum > 2100) {
      return NextResponse.json({ error: 'Valid year is required' }, { status: 400 });
    }

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'At least one employee is required' }, { status: 400 });
    }

    const formattedEmployees = employees.map((e: any) => ({
      userId: e.userId,
      employeeId: e.employeeId,
      name: e.name,
      department: e.department || '',
      designation: e.designation || '',
      monthlySalary: Number(e.monthlySalary) || 0,
      basicSalary: Number(e.basicSalary) || 0,
      bonusAmount: Math.max(0, Number(e.bonusAmount) || 0),
      remarks: e.remarks || ''
    }));

    const totalAmount = formattedEmployees.reduce((sum: number, e: any) => sum + e.bonusAmount, 0);
    const distributedCount = formattedEmployees.filter((e: any) => e.bonusAmount > 0).length;

    let bonusRecord;

    if (id) {
      bonusRecord = await BonusHistory.findById(id);
      if (bonusRecord) {
        bonusRecord.title = title.trim();
        bonusRecord.month = mNum;
        bonusRecord.year = yNum;
        bonusRecord.employees = formattedEmployees as any;
        bonusRecord.totalAmount = totalAmount;
        bonusRecord.distributedCount = distributedCount;
        bonusRecord.notes = notes || '';
        bonusRecord.updatedAt = new Date();
        await bonusRecord.save();
      }
    }

    if (!bonusRecord) {
      // Check for existing record for month & year to upsert
      const query: any = { month: mNum, year: yNum };
      if (activeCompanyId) query.companyId = activeCompanyId;

      const existing = await BonusHistory.findOne(query);

      if (existing) {
        existing.title = title.trim();
        existing.employees = formattedEmployees as any;
        existing.totalAmount = totalAmount;
        existing.distributedCount = distributedCount;
        existing.notes = notes || '';
        existing.updatedAt = new Date();
        await existing.save();
        bonusRecord = existing;
      } else {
        bonusRecord = await BonusHistory.create({
          companyId: activeCompanyId,
          title: title.trim(),
          month: mNum,
          year: yNum,
          employees: formattedEmployees,
          totalAmount,
          distributedCount,
          notes: notes || '',
          createdBy: session.user.id
        });
      }
    }

    return NextResponse.json({
      message: 'Bonus distribution saved successfully',
      bonusHistory: bonusRecord
    }, { status: 200 });
  } catch (error: any) {
    console.error('BonusHistory POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save bonus history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['super_admin', 'company_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bonus history ID is required' }, { status: 400 });
    }

    const deleted = await BonusHistory.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Bonus history record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bonus history deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('BonusHistory DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete bonus history' }, { status: 500 });
  }
}
