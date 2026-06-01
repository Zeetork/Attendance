import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LeavesClient from './LeavesClient';

export const metadata = {
  title: 'Leaves - Admin HRMS',
};

export default async function LeavesPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return <LeavesClient />;
}