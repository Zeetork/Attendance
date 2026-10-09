import { ReactNode } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login?error=inactive');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}