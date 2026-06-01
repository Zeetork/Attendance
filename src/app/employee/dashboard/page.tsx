import { auth } from '@/auth';
import DashboardClient from './DashboardClient';

export default async function EmployeeDashboard() {
  const session = await auth();

  return <DashboardClient />;
}
