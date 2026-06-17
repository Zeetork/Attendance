import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LeavesClient from './LeavesClient';

export const metadata = {
  title: 'My Leaves - HRMS',
};

export default async function LeavesPage() {
  const session = await auth();
  
  if (!session || ['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <LeavesClient />;
}