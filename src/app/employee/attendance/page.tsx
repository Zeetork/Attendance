import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export const metadata = {
  title: 'My Attendance - HRMS',
};

export default async function EmployeeAttendancePage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'employee') {
    redirect('/login');
  }

  return <AttendanceClient />;
}