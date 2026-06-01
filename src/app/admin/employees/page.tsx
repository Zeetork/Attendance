import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Shift from '@/models/Shift';
import EmployeeClient from './EmployeeClient';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  await dbConnect();
  
  let shiftsDoc = await Shift.find({ isActive: true }).lean();
  
  if (shiftsDoc.length === 0) {
    await Shift.create([
      { shiftName: 'Shift A', startTime: '07:30', endTime: '16:30', graceTime: 15 },
      { shiftName: 'Shift B', startTime: '09:00', endTime: '18:00', graceTime: 15 }
    ]);
    shiftsDoc = await Shift.find({ isActive: true }).lean();
  }
  
  const employeesDoc = await User.find({ role: 'employee' }).populate('shiftId').sort({ createdAt: -1 }).lean();
  const employees = JSON.parse(JSON.stringify(employeesDoc));
  const shifts = JSON.parse(JSON.stringify(shiftsDoc));

  return <EmployeeClient initialEmployees={employees} shifts={shifts} />;
}
