'use client';

import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, FileText, DollarSign, Calendar } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];

export default function ReportsClient() {
  const { data, error, isLoading } = useSWR('/api/admin/reports', fetcher);

  const handleExport = async () => {
    if (!data) return;
    
    const workbook = new ExcelJS.Workbook();
    
    // Attendance Sheet
    const sheet1 = workbook.addWorksheet('Attendance Last 7 Days');
    sheet1.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Present', key: 'present', width: 15 },
      { header: 'Late', key: 'late', width: 15 },
      { header: 'Half Day', key: 'halfDay', width: 15 }
    ];
    data.attendanceStats.forEach((stat: any) => sheet1.addRow(stat));

    // Summary Sheet
    const sheet2 = workbook.addWorksheet('Summary');
    sheet2.addRow(['Metric', 'Value']);
    sheet2.addRow(['Total Employees', data.employees]);
    sheet2.addRow(['Pending Leaves', data.leaveStats.pending]);
    sheet2.addRow(['Approved Leaves', data.leaveStats.approved]);
    sheet2.addRow(['Rejected Leaves', data.leaveStats.rejected]);
    sheet2.addRow(['Payroll Total Payout', `₹${data.payrollStats.totalPayout}`]);
    sheet2.addRow(['Payroll Deductions', `₹${data.payrollStats.totalDeductions}`]);
    sheet2.addRow(['Payrolls Generated', data.payrollStats.totalGenerated]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HRMS_Report_${format(new Date(), 'yyyy_MM_dd')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-neutral-900 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-neutral-900 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-neutral-900 rounded-xl"></div>
          <div className="h-96 bg-neutral-900 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const leavePieData = [
    { name: 'Pending', value: data?.leaveStats?.pending || 0 },
    { name: 'Approved', value: data?.leaveStats?.approved || 0 },
    { name: 'Rejected', value: data?.leaveStats?.rejected || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics & Reports</h1>
          <p className="text-sm text-neutral-400 mt-1">View comprehensive HR and payroll data.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-md hover:bg-neutral-700 transition-colors shadow-sm font-medium"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-blue-500/10 mr-4">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Active Employees</div>
            <div className="text-2xl font-bold text-white">{data?.employees}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-green-500/10 mr-4">
            <DollarSign className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Monthly Payout</div>
            <div className="text-2xl font-bold text-white">₹{data?.payrollStats?.totalPayout?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-amber-500/10 mr-4">
            <FileText className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Pending Leaves</div>
            <div className="text-2xl font-bold text-white">{data?.leaveStats?.pending || 0}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex items-center">
          <div className="rounded-lg p-3 bg-red-500/10 mr-4">
            <Calendar className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <div className="text-sm text-neutral-400 font-medium">Total Deductions</div>
            <div className="text-2xl font-bold text-white">₹{data?.payrollStats?.totalDeductions?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-white mb-6">Attendance Overview (Last 7 Days)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.attendanceStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#262626' }}
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="halfDay" name="Half Day" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-white mb-6">Leave Requests Status</h2>
          <div className="h-80 w-full flex justify-center items-center">
            {leavePieData.every(d => d.value === 0) ? (
              <div className="text-neutral-500">No leave data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
