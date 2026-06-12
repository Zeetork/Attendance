import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AttendanceCalendar from '@/app/admin/calendar/AttendanceCalendar';

export const metadata = {
  title: 'Employee Calendar | HRMS Admin',
};

export default async function AdminCalendarPage() {
  const session = await auth();

  if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <AttendanceCalendar isAdmin={true} />;
}
