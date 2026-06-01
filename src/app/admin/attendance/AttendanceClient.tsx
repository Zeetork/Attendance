'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Search, Download, Filter, User, Edit, X, Loader2 } from 'lucide-react';
import * as ExcelJS from 'exceljs';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AttendanceClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, statusFilter, shiftFilter]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(dateFilter && { date: dateFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(shiftFilter && { shift: shiftFilter }),
  }).toString();

  const { data, error, isLoading, mutate } = useSWR(`/api/admin/attendance?${queryParams}`, fetcher, {
    refreshInterval: 10000, // Poll for live updates
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    loginTime: '',
    logoutTime: '',
    status: 'present',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    
    // Format times to HH:mm for time inputs
    const formatTimeForInput = (dateString?: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    setEditFormData({
      loginTime: formatTimeForInput(record.loginTime),
      logoutTime: formatTimeForInput(record.logoutTime),
      status: record.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/attendance/${editingRecord._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update attendance');
      } else {
        mutate();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const { data: shiftData } = useSWR('/api/shifts', fetcher);

  const handleExport = async () => {
    if (!data?.attendances?.length) return;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');
    
    worksheet.columns = [
      { header: 'Employee ID', key: 'empId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Shift', key: 'shift', width: 15 },
      { header: 'Check In', key: 'in', width: 15 },
      { header: 'Check Out', key: 'out', width: 15 },
      { header: 'Total Hours', key: 'hours', width: 15 },
      { header: 'Late (Mins)', key: 'late', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    data.attendances.forEach((a: any) => {
      worksheet.addRow({
        empId: a.userId?.employeeId,
        name: a.userId?.name,
        date: format(new Date(a.date), 'yyyy-MM-dd'),
        shift: a.userId?.shiftId?.shiftName || 'N/A',
        in: a.loginTime ? format(new Date(a.loginTime), 'hh:mm a') : '-',
        out: a.logoutTime ? format(new Date(a.logoutTime), 'hh:mm a') : '-',
        hours: a.totalHours ? a.totalHours.toFixed(2) : '-',
        late: a.lateMinutes || 0,
        status: a.status.toUpperCase(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-500/10 text-green-500 border-green-500/20',
      absent: 'bg-red-500/10 text-red-500 border-red-500/20',
      'half-day': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      late: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-neutral-800 text-neutral-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Attendance Log</h1>
        <button 
          onClick={handleExport}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-md hover:bg-neutral-700 transition-colors shadow-sm text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-700 rounded-md leading-5 bg-neutral-800 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <input 
          type="date"
          className="w-full md:w-48 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select 
          className="w-full md:w-48 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="half-day">Half-Day</option>
          <option value="absent">Absent</option>
        </select>

        <select 
          className="w-full md:w-48 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
        >
          <option value="">All Shifts</option>
          {shiftData?.shifts?.map((s: any) => (
            <option key={s._id} value={s._id}>{s.shiftName}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-800/50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Shift</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">In/Out Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Hours</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Late</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-3/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-800 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                ))
              ) : data?.attendances?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">No attendance records found.</td>
                </tr>
              ) : (
                data?.attendances?.map((record: any) => (
                  <tr key={record._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden">
                          {record.userId?.profileImage ? (
                            <img src={record.userId.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-neutral-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{record.userId?.name}</div>
                          <div className="text-xs text-neutral-500">{record.userId?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded">
                        {record.userId?.shiftId?.shiftName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">In: {record.loginTime ? format(new Date(record.loginTime), 'hh:mm a') : '--:--'}</div>
                      <div className="text-sm text-neutral-500">Out: {record.logoutTime ? format(new Date(record.logoutTime), 'hh:mm a') : '--:--'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {record.lateMinutes > 0 ? <span className="text-amber-500">{record.lateMinutes}m</span> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => openEditModal(record)}
                        className="text-neutral-400 hover:text-white transition-colors p-1"
                        title="Edit Attendance"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="bg-neutral-900 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800">
            <div className="text-sm text-neutral-400 text-center sm:text-left">
              Showing <span className="font-medium text-white">{(page - 1) * 10 + 1}</span> to <span className="font-medium text-white">{Math.min(page * 10, data.pagination.total)}</span> of <span className="font-medium text-white">{data.pagination.total}</span> results
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-neutral-950/75 backdrop-blur-sm z-0" onClick={() => setIsEditModalOpen(false)} />

            <div className="relative z-10 inline-block w-full max-w-md px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
              <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white">Edit Attendance</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="bg-neutral-800/50 p-3 rounded-lg mb-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">Employee:</span>
                    <span className="text-white font-medium">{editingRecord?.userId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Date:</span>
                    <span className="text-white">{editingRecord?.date ? format(new Date(editingRecord.date), 'MMM dd, yyyy') : ''}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half-Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Check In Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                      value={editFormData.loginTime}
                      onChange={(e) => setEditFormData({...editFormData, loginTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Check Out Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                      value={editFormData.logoutTime}
                      onChange={(e) => setEditFormData({...editFormData, logoutTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-neutral-800 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-neutral-700 shadow-sm px-4 py-2 bg-neutral-800 text-base font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
