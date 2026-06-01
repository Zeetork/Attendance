import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PayslipsClient from './PayslipsClient';

export const metadata = {
  title: 'My Payslips - HRMS',
};

export default async function PayslipsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'employee') {
    redirect('/login');
  }

  return <PayslipsClient />;
}