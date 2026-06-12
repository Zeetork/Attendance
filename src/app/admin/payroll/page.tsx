import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PayrollClient from './PayrollClient';

export const metadata = {
  title: 'Payroll - Admin HRMS',
};

export default async function PayrollPage() {
  const session = await auth();
  
  if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/login');
  }

  return <PayrollClient />;
}
