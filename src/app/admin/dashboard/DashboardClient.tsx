'use client';

import { Users, UserCheck, AlertTriangle, FileSpreadsheet, Clock } from 'lucide-react';
import useSWR from 'swr';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardClient() {
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds for real-time feel
  });

  if (error) return <div className="text-destructive">Failed to load dashboard</div>;

  const defaultStats = [
    { name: 'Total Employees', value: '-', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Present Today', value: '-', icon: UserCheck, color: 'text-success', bg: 'bg-success/10' },
    { name: 'Absent Today', value: '-', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { name: 'Total SL Used', value: '-', icon: FileSpreadsheet, color: 'text-warning', bg: 'bg-warning/10' },
    { name: 'Total CL Used', value: '-', icon: FileSpreadsheet, color: 'text-warning', bg: 'bg-warning/10' },
    { name: 'Total LWP Used', value: '-', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { name: 'Pending Leaves', value: '-', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Half Day Requests', value: '-', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  const stats = data ? [
    { name: 'Total Employees', value: data.stats.totalEmployees, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Present Today', value: data.stats.presentToday, icon: UserCheck, color: 'text-success', bg: 'bg-success/10' },
    { name: 'Absent Today', value: data.stats.absentToday, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { name: 'Total SL Used', value: data.stats.totalSLUsed, icon: FileSpreadsheet, color: 'text-warning', bg: 'bg-warning/10' },
    { name: 'Total CL Used', value: data.stats.totalCLUsed, icon: FileSpreadsheet, color: 'text-warning', bg: 'bg-warning/10' },
    { name: 'Total LWP Used', value: data.stats.totalLWPUsed, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { name: 'Pending Leaves', value: data.stats.pendingLeaves, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Half Day Requests', value: data.stats.halfDayRequests, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  ] : defaultStats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className={`rounded-xl p-2.5 sm:p-3 w-fit mb-3 sm:mb-0 ${item.bg}`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} aria-hidden="true" />
                </div>
                <div className="sm:ml-4 w-full flex-1">
                  <dl>
                    <dt className="truncate text-xs sm:text-sm font-bold text-muted-foreground">{item.name}</dt>
                    <dd>
                      <div className="text-xl sm:text-2xl font-black text-card-foreground mt-1 sm:mt-0">
                        {isLoading ? <div className="h-6 w-12 bg-muted animate-pulse rounded-md"></div> : item.value}
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
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-base sm:text-lg font-bold text-card-foreground">Recent Activities (Real-Time)</h2>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/80 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
              <span className="text-xs font-bold text-muted-foreground">Live</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted animate-pulse rounded-md w-full"></div>)}
              </div>
            ) : data?.activities?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground font-bold">No recent activities</div>
            ) : (
              data?.activities?.map((activity: any, i: number) => (
                <div key={i} className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-2 gap-1 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${activity.type === 'warning' ? 'bg-warning' :
                      activity.type === 'info' ? 'bg-primary' :
                        activity.type === 'success' ? 'bg-success' : 'bg-destructive'
                      }`}></div>
                    <span className="text-sm font-medium text-card-foreground">{activity.text}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-base sm:text-lg font-bold text-card-foreground">Pending Leave Requests</h2>
          </div>
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl w-full"></div>)}
              </div>
            ) : data?.leaveRequests?.length === 0 ? (
              <div className="text-center text-muted-foreground font-bold py-4">No pending leave requests</div>
            ) : (
              <div className="space-y-4">
                {data?.leaveRequests?.map((leave: any) => (
                  <div key={leave._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-card-foreground">{leave.userId?.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{leave.leaveType} • {Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 3600 * 24)) + 1} Days</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(leave.fromDate), 'MMM dd')} - {format(new Date(leave.toDate), 'MMM dd')}</p>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-4 py-2 min-h-[40px] bg-success/10 text-success hover:bg-success/20 rounded-xl text-xs font-bold border border-success/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-card">
                        Approve
                      </button>
                      <button className="flex-1 sm:flex-none px-4 py-2 min-h-[40px] bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl text-xs font-bold border border-destructive/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-card">
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