import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export const metadata = {
  title: 'Reports - Admin HRMS',
};

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return <ReportsClient />;
}