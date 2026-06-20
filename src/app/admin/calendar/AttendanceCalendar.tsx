'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  startOfWeek, 
  endOfWeek,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, User as UserIcon, Download } from 'lucide-react';
import clsx from 'clsx';
import * as ExcelJS from 'exceljs';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Props {
  userId?: string;
  isAdmin?: boolean;
}

export default function AttendanceCalendar({ userId, isAdmin = false }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string | undefined>(userId);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editData, setEditData] = useState({ status: 'present', loginTime: '', logoutTime: '', duration: 'full_day', halfDaySession: 'first_half' });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch employees list if admin
  const { data: employeesData } = useSWR(isAdmin ? '/api/admin/employees' : null, fetcher);
  
  const [isExporting, setIsExporting] = useState(false);

  const monthStr = format(currentDate, 'yyyy-MM');
  const queryUrl = selectedUser 
    ? `/api/calendar?month=${monthStr}&userId=${selectedUser}` 
    : `/api/calendar?month=${monthStr}`;

  const { data, error, isLoading, mutate } = useSWR(queryUrl, fetcher);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getDayStatus = (day: Date) => {
    if (!data || data.error) return null;

    // 1. Check Attendance
    const attendance = data.attendances?.find((a: any) => isSameDay(new Date(a.date), day));
    if (attendance) {
      if (attendance.status === 'present') {
        const hours = attendance.totalHours ? `${attendance.totalHours.toFixed(2)} Hrs` : (attendance.loginTime && !attendance.logoutTime) ? 'Working' : '';
        return { type: 'present', label: 'Present', subLabel: hours, color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      }
      if (attendance.status === 'half-day') {
        return { type: 'half-day', label: 'Half Day', subLabel: attendance.totalHours ? `${attendance.totalHours.toFixed(2)} Hrs` : '', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      }
      if (attendance.status === 'absent') {
        return { type: 'absent', label: 'Absent', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      }
      if (attendance.status === 'late') {
        return { type: 'late', label: 'Late', subLabel: `${attendance.lateMinutes}m late`, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
      }
    }

    // 2. Check Leaves
    const leave = data.leaves?.find((l: any) => {
      const from = new Date(l.fromDate);
      const to = new Date(l.toDate);
      // Strip time
      from.setHours(0,0,0,0);
      to.setHours(0,0,0,0);
      const current = new Date(day);
      current.setHours(0,0,0,0);
      return current >= from && current <= to;
    });
    
    if (leave) return { type: 'leave', label: 'Absent', subLabel: leave.leaveType, color: 'bg-red-500/10 text-red-500 border-red-500/20' };

    // 3. Check Holidays
    const holiday = data.holidays?.find((h: any) => isSameDay(new Date(h.date), day));
    if (holiday) return { type: 'holiday', holidayType: holiday.holidayType, label: holiday.holidayName, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };

    // 4. Default for past weekdays
    const isPast = day < new Date(new Date().setHours(0,0,0,0));
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    
    if (isPast && !isWeekend) {
        // If they joined after this day, don't mark as absent
        if (data.user?.joiningDate && day < new Date(data.user.joiningDate)) {
            return { type: 'not-joined', label: '-', color: 'bg-neutral-800/50 text-neutral-500 border-transparent' };
        }
        return { type: 'unmarked', label: 'Absent', subLabel: 'No punch', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    }

    return null; // Future or weekend
  };

  const handleDayClick = (day: Date, status: any) => {
    if (!isAdmin || !selectedUser) return;
    
    if (status?.type === 'holiday' && ['public', 'company'].includes(status.holidayType)) {
      toast.error('Cannot mark attendance on a Public or Company Holiday. It is a mandatory paid leave.');
      return;
    }
    
    setSelectedDate(day);
    setIsEditModalOpen(true);
    
    const attendance = data?.attendances?.find((a: any) => isSameDay(new Date(a.date), day));
    const leave = data?.leaves?.find((l: any) => {
      const from = new Date(l.fromDate);
      const to = new Date(l.toDate);
      from.setHours(0,0,0,0);
      to.setHours(0,0,0,0);
      const current = new Date(day);
      current.setHours(0,0,0,0);
      return current >= from && current <= to;
    });
    
    if (attendance) {
      setEditData({
        status: attendance.status,
        loginTime: attendance.loginTime ? format(new Date(attendance.loginTime), 'HH:mm') : '',
        logoutTime: attendance.logoutTime ? format(new Date(attendance.logoutTime), 'HH:mm') : '',
        duration: 'full_day',
        halfDaySession: 'first_half'
      });
    } else if (leave) {
      setEditData({
        status: leave.leaveType,
        loginTime: '',
        logoutTime: '',
        duration: leave.duration || 'full_day',
        halfDaySession: leave.halfDaySession || 'first_half'
      });
    } else {
      setEditData({ status: 'present', loginTime: '09:00', logoutTime: '18:00', duration: 'full_day', halfDaySession: 'first_half' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDate || !selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/attendance/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          date: format(selectedDate, 'yyyy-MM-dd'),
          ...editData
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update attendance');
      }
      await mutate();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error updating attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/calendar/export?month=${monthStr}`);
      if (!res.ok) throw new Error('Failed to fetch export data');
      const exportData = await res.json();
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Attendance');
      
      const daysInThisMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
      
      const headerRow = worksheet.getRow(1);
      headerRow.getCell(1).value = 'Employee Name';
      worksheet.getColumn(1).width = 25;

      daysInThisMonth.forEach((day, idx) => {
        headerRow.getCell(idx + 2).value = format(day, 'd');
        worksheet.getColumn(idx + 2).width = 12;
      });
      headerRow.font = { bold: true };
      
      exportData.users.forEach((user: any, userIdx: number) => {
        const row = worksheet.getRow(2 + userIdx);
        row.getCell(1).value = user.name;
        
        daysInThisMonth.forEach((day, dayIdx) => {
          let status = '';
          const currentDay = new Date(day).setHours(0,0,0,0);
          const now = new Date().setHours(0,0,0,0);
          
          const isHoliday = exportData.holidays?.some((h: any) => isSameDay(new Date(h.date), day));
          
          const leave = exportData.leaves?.find((l: any) => {
            const from = new Date(l.fromDate).setHours(0,0,0,0);
            const to = new Date(l.toDate).setHours(0,0,0,0);
            return l.userId === user._id && currentDay >= from && currentDay <= to;
          });
          
          const att = exportData.attendances?.find((a: any) => a.userId === user._id && isSameDay(new Date(a.date), day));
          
          if (att) {
            if (att.status === 'present') status = 'Present';
            else if (att.status === 'half-day') status = 'Half Day';
            else if (att.status === 'late') status = 'Late';
            else if (att.status === 'absent') status = 'Absent';
          } else if (leave) {
            const type = leave.leaveType || 'Leave';
            if (type.toLowerCase().includes('sick')) status = 'SL';
            else if (type.toLowerCase().includes('casual')) status = 'CL';
            else status = type.split(' ').map((w: string) => w[0]).join('').toUpperCase();
          } else if (isHoliday) {
            status = 'Holiday';
          } else {
            if (day.getDay() === 0 || day.getDay() === 6) {
              status = 'WO'; 
            } else if (currentDay > now) {
              status = ''; 
            } else if (user.joiningDate && currentDay < new Date(user.joiningDate).setHours(0,0,0,0)) {
              status = '-';
            } else {
              status = 'Absent';
            }
          }
          
          row.getCell(dayIdx + 2).value = status;
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attendance_Calendar_${format(currentDate, 'MMM_yyyy')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-[140px] justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-white">{format(currentDate, 'MMMM yyyy')}</span>
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-md hover:bg-neutral-700 transition-colors shadow-sm text-sm disabled:opacity-50 mr-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Excel
            </button>
            <UserIcon className="w-4 h-4 text-neutral-400" />
            <select
              className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64 p-2"
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select Employee...</option>
              {employeesData?.users?.map((emp: any) => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-neutral-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          {data?.error && (
            <div className="absolute inset-0 z-10 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">{data.error}</div>
            </div>
          )}
          <div className="grid grid-cols-7 auto-rows-fr bg-neutral-800 gap-[1px]">
            {daysInMonth.map((day, idx) => {
              const status = getDayStatus(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  onClick={() => handleDayClick(day, status)}
                  className={clsx(
                    "min-h-[120px] bg-neutral-900 p-2 transition-colors",
                    !isCurrentMonth && "bg-neutral-900/50 opacity-50",
                    today && "ring-1 ring-inset ring-blue-500/50 bg-blue-500/5",
                    isAdmin && selectedUser && "cursor-pointer hover:bg-neutral-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      today ? "bg-blue-600 text-white" : isCurrentMonth ? "text-neutral-300" : "text-neutral-600",
                      (day.getDay() === 0 || day.getDay() === 6) && isCurrentMonth && !today && "text-red-400"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {status && (
                    <div className={clsx("px-2 py-1.5 rounded-md border text-xs", status.color)}>
                      <div className="font-semibold">{status.label}</div>
                      {status.subLabel && <div className="text-[10px] opacity-80 mt-0.5 truncate">{status.subLabel}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Attendance - {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Status</label>
                <select 
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editData.status}
                  onChange={e => setEditData({...editData, status: e.target.value})}
                >
                  <optgroup label="Attendance">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                  </optgroup>
                  <optgroup label="Leaves">
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Compensatory Off">Compensatory Off</option>
                    <option value="Restricted Holiday">Restricted Holiday</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Leave Without Pay">Leave Without Pay</option>
                  </optgroup>
                </select>
              </div>

              {!['present', 'absent', 'half-day', 'late'].includes(editData.status) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Leave Duration</label>
                    <select 
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editData.duration}
                      onChange={e => setEditData({...editData, duration: e.target.value})}
                    >
                      <option value="full_day">Full Day</option>
                      <option value="half_day">Half Day</option>
                    </select>
                  </div>
                  {editData.duration === 'half_day' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Half Day Session</label>
                      <select 
                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editData.halfDaySession}
                        onChange={e => setEditData({...editData, halfDaySession: e.target.value})}
                      >
                        <option value="first_half">First Half (Morning)</option>
                        <option value="second_half">Second Half (Afternoon)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {['present', 'late', 'half-day'].includes(editData.status) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Login Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 [color-scheme:dark] focus:ring-blue-500 focus:border-blue-500"
                      value={editData.loginTime}
                      onChange={e => setEditData({...editData, loginTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Logout Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 [color-scheme:dark] focus:ring-blue-500 focus:border-blue-500"
                      value={editData.logoutTime}
                      onChange={e => setEditData({...editData, logoutTime: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
