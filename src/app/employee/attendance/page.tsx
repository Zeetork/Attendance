import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export const metadata = {
  title: 'My Attendance - HRMS',
};

export default async function EmployeeAttendancePage() {
  const session = await auth();
  
  if (!session || ['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <AttendanceClient />;
}