import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AttendanceCalendar from '@/app/admin/calendar/AttendanceCalendar';

export const metadata = {
  title: 'My Calendar | HRMS',
};

export default async function EmployeeCalendarPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <AttendanceCalendar userId={session.user.id} />;
}
