import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LeavesClient from './LeavesClient';

export const metadata = {
  title: 'My Leaves - HRMS',
};

export default async function LeavesPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'employee') {
    redirect('/login');
  }

  return <LeavesClient />;
}