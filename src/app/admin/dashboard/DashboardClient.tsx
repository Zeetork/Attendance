'use client';

import { Users, UserCheck, AlertTriangle, FileSpreadsheet, Clock } from 'lucide-react';
import useSWR from 'swr';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardClient() {
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds for real-time feel
  });

  if (error) return <div className="text-red-500">Failed to load dashboard</div>;

  const defaultStats = [
    { name: 'Total Employees', value: '-', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Present Today', value: '-', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Absent Today', value: '-', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Late Today', value: '-', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Pending Leaves', value: '-', icon: FileSpreadsheet, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const stats = data ? [
    { name: 'Total Employees', value: data.stats.totalEmployees, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Present Today', value: data.stats.presentToday, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Absent Today', value: data.stats.absentToday, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Late Today', value: data.stats.lateEmployees, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Pending Leaves', value: data.stats.pendingLeaves, icon: FileSpreadsheet, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ] : defaultStats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${item.bg}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-neutral-400">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-bold text-white">
                        {isLoading ? <div className="h-6 w-12 bg-neutral-800 animate-pulse rounded"></div> : item.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Recent Activities (Real-Time)</h2>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs text-neutral-400">Live</span>
            </div>
          </div>
          <div className="divide-y divide-neutral-800">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-neutral-800 animate-pulse rounded w-full"></div>)}
              </div>
            ) : data?.activities?.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">No recent activities</div>
            ) : (
              data?.activities?.map((activity: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${activity.type === 'warning' ? 'bg-amber-500' :
                        activity.type === 'info' ? 'bg-blue-500' :
                          activity.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    <span className="text-sm text-neutral-300">{activity.text}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Pending Leave Requests</h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-16 bg-neutral-800 animate-pulse rounded w-full"></div>)}
              </div>
            ) : data?.leaveRequests?.length === 0 ? (
              <div className="text-center text-neutral-500">No pending leave requests</div>
            ) : (
              <div className="space-y-4">
                {data?.leaveRequests?.map((leave: any) => (
                  <div key={leave._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-800/40 rounded-lg border border-neutral-800/50">
                    <div>
                      <h3 className="text-sm font-medium text-white">{leave.userId?.name}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{leave.leaveType} • {Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 3600 * 24)) + 1} Days</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{format(new Date(leave.fromDate), 'MMM dd')} - {format(new Date(leave.toDate), 'MMM dd')}</p>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded text-xs font-medium border border-green-500/20 transition-colors">
                        Approve
                      </button>
                      <button className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs font-medium border border-red-500/20 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
