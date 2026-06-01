'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, subMonths, isSameDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EmployeeAttendanceClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data, error, isLoading } = useSWR(`/api/employee/attendance?month=${month}&year=${year}`, fetcher);
  const attendances = data?.attendances || [];

  const months = Array.from({ length: 12 }).map((_, i) => subMonths(new Date(), i));

  // Calculate summary stats
  const presentCount = attendances.filter((a: any) => a.status === 'present').length;
  const lateCount = attendances.filter((a: any) => a.status === 'late').length;
  const halfDayCount = attendances.filter((a: any) => a.status === 'half-day').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1" /> Present</span>;
      case 'late': return <span className="px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center w-fit"><AlertCircle className="w-3 h-3 mr-1" /> Late</span>;
      case 'half-day': return <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> Half Day</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center w-fit"><XCircle className="w-3 h-3 mr-1" /> Absent</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Attendance History</h1>
          <p className="text-sm text-neutral-400 mt-1">View your daily logs and monthly summaries.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select 
            className="w-full sm:w-auto bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 shadow-sm"
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            value={currentDate.toISOString()}
          >
            {months.map((m, i) => (
              <option key={i} value={m.toISOString()}>{format(m, 'MMMM yyyy')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-green-500/10 mr-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Full Days Present</div>
            <div className="text-2xl font-bold text-white">{presentCount}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-amber-500/10 mr-4">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Late Marks</div>
            <div className="text-2xl font-bold text-white">{lateCount}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-blue-500/10 mr-4">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Half Days</div>
            <div className="text-2xl font-bold text-white">{halfDayCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
            {format(currentDate, 'MMMM yyyy')} Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500 animate-pulse">Loading attendance records...</td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500">No attendance records found for this month.</td></tr>
              ) : (
                attendances.map((att: any) => (
                  <tr key={att._id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{format(new Date(att.date), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-neutral-500">{format(new Date(att.date), 'EEEE')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {att.loginTime ? format(new Date(att.loginTime), 'hh:mm a') : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {att.logoutTime ? format(new Date(att.logoutTime), 'hh:mm a') : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 font-medium">
                      {att.totalHours ? `${att.totalHours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(att.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
