import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CalendarClient from './CalendarClient';

export const metadata = {
  title: 'Settings - HRMS',
};

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <CalendarClient />;
}