import { auth } from '@/auth';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <div className="flex w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium">
            Generate Payroll
          </button>
        </div>
      </div>

      <DashboardClient />
    </div>
  );
}
