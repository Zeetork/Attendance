import { auth } from '@/auth';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium">
            Generate Payroll
          </button>
        </div>
      </div>

      <DashboardClient />
    </div>
  );
}
