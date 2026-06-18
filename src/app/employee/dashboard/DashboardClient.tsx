'use client';

import { Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import useSWR from 'swr';
import { format } from 'date-fns';
import ReportingStructure from './ReportingStructure';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EmployeeDashboardClient() {
  const { data, error, isLoading } = useSWR('/api/employee/dashboard', fetcher, {
    refreshInterval: 5000,
  });

  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR('/api/holidays', fetcher);

  if (error) return <div className="text-red-500">Failed to load dashboard data</div>;

  const getShiftDisplay = () => {
    if (!data?.shift) return 'No Shift Assigned';
    return `${data.shift.shiftName} (${data.shift.startTime} - ${data.shift.endTime})`;
  };

  const getStatusDisplay = () => {
    if (!data?.todayAttendance) return 'Not Checked In';
    return data.todayAttendance.status.charAt(0).toUpperCase() + data.todayAttendance.status.slice(1);
  };

  const stats = [
    { name: 'Today Attendance', value: isLoading ? '...' : getStatusDisplay(), icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Monthly Attendance', value: isLoading ? '...' : `${data?.attendancePercentage}% (${data?.presentDays}/${data?.workingDays} Days)`, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Leaves (Available / Used)', value: isLoading ? '...' : `${data?.availableLeave ?? 0} / ${data?.takenLeaves ?? 0}`, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Half Day Leaves', value: isLoading ? '...' : `${data?.halfDayCount ?? 0} Taken`, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ReportingStructure
            manager={data?.manager}
            currentUser={data?.currentUser}
            subordinates={data?.subordinates}
            isLoading={isLoading}
            todayAttendance={data?.todayAttendance}
          />
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 xl:grid-cols-2">
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
                          <div className="text-lg font-bold text-white">{item.value}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white">Recent Attendance</h2>
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="text-xs text-neutral-400">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-12 bg-neutral-800 animate-pulse rounded w-full"></div>)
                ) : data?.recentAttendances?.length === 0 ? (
                  <div className="text-neutral-500 text-center py-4">No recent attendance</div>
                ) : (
                  data?.recentAttendances?.map((att: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-800/50 rounded-lg gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${att.status === 'present' ? 'bg-green-500' : att.status === 'late' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium text-neutral-300">{format(new Date(att.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex space-x-4 text-sm text-neutral-400">
                        <span>In: {att.loginTime ? format(new Date(att.loginTime), 'hh:mm a') : '--:--'}</span>
                        <span>Out: {att.logoutTime ? format(new Date(att.logoutTime), 'hh:mm a') : '--:--'}</span>
                        <span className={`px-2 py-0.5 h-max rounded text-xs font-medium border ${att.status === 'present' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                          att.status === 'late' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                            'text-red-400 bg-red-400/10 border-red-400/20'
                          }`}>
                          {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>



            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6 lg:col-span-1">
              <h2 className="text-lg font-medium text-white mb-4">Upcoming Holidays</h2>
              {isLoadingHolidays ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-800 animate-pulse rounded w-full"></div>)}
                </div>
              ) : holidaysData?.holidays?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                  <Calendar className="h-8 w-8 mb-2 opacity-50" />
                  <p>No upcoming holidays.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {holidaysData?.holidays?.slice(0, 5).map((holiday: any) => {
                    const colors = {
                      public: 'bg-red-500/10 text-red-500 border-red-500/20',
                      restricted: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                      company: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      'half-day': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                      'working-day': 'bg-green-500/10 text-green-500 border-green-500/20',
                    };

                    return (
                      <div key={holiday._id} className="flex items-center justify-between p-3 bg-neutral-800/40 rounded-lg border border-neutral-800/50 hover:bg-neutral-800/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-neutral-800 text-neutral-300 shadow-sm border border-neutral-700">
                            <span className="text-xs font-medium uppercase">{format(new Date(holiday.date), 'MMM')}</span>
                            <span className="text-lg font-bold leading-none">{format(new Date(holiday.date), 'dd')}</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">{holiday.holidayName}</h3>
                            <p className="text-xs text-neutral-400 mt-0.5">{format(new Date(holiday.date), 'EEEE')}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-medium rounded uppercase tracking-wider border ${colors[holiday.holidayType as keyof typeof colors]}`}>
                          {holiday.holidayType.replace('-', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-white mb-4">Upcoming Leaves</h2>
              {isLoading ? (
                <div className="h-48 bg-neutral-800 animate-pulse rounded w-full"></div>
              ) : data?.upcomingLeaves?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                  <Calendar className="h-8 w-8 mb-2 opacity-50" />
                  <p>No upcoming leaves scheduled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.upcomingLeaves?.map((leave: any) => (
                    <div key={leave._id} className="p-4 bg-neutral-800/40 rounded-lg border border-neutral-800/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-white">{leave.leaveType}</h3>
                          <p className="text-xs text-neutral-400 mt-1">{format(new Date(leave.fromDate), 'MMM dd, yyyy')} - {format(new Date(leave.toDate), 'MMM dd, yyyy')}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${leave.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="mt-4 px-4 py-2 w-full text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors">
                Apply for Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
