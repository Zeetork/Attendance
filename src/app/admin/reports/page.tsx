import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export const metadata = {
  title: 'Reports - Admin HRMS',
};

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <ReportsClient />;
}