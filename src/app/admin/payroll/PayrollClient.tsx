'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, subMonths } from 'date-fns';
import { Search, Download, PlayCircle, FileText, Loader2, User as UserIcon, Mail } from 'lucide-react';
import * as ExcelJS from 'exceljs';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PayrollClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/payroll?month=${month}&year=${year}`, fetcher);
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const handleSendEmail = async (payrollId: string) => {
    setSendingEmail(payrollId);
    try {
      const res = await fetch('/api/admin/payroll/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send email');
      }
      alert('Email sent successfully!');
    } catch (error: any) {
      alert(`Error sending email: ${error.message}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!payrolls.length) return;
    if (!confirm(`Are you sure you want to send payslips to all ${payrolls.length} employees?`)) return;
    
    setIsSendingBulk(true);
    let successCount = 0;
    let errorMessages: string[] = [];
    
    for (let i = 0; i < payrolls.length; i++) {
      setBulkProgress({ current: i + 1, total: payrolls.length });
      try {
        const res = await fetch('/api/admin/payroll/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payrollId: payrolls[i]._id })
        });
        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error || 'Server returned error';
          console.error(`Failed to send email to ${payrolls[i].userId?.name}:`, errMsg);
          errorMessages.push(`${payrolls[i].userId?.name}: ${errMsg}`);
        }
      } catch (error: any) {
        console.error('Failed to send email to', payrolls[i].userId?.name, error);
        errorMessages.push(`${payrolls[i].userId?.name}: Network error`);
      }
    }
    
    let resultMsg = `Successfully sent ${successCount} out of ${payrolls.length} emails.`;
    if (errorMessages.length > 0) {
      resultMsg += `\n\nFailed (${errorMessages.length}):\n${errorMessages.slice(0, 5).join('\n')}`;
      if (errorMessages.length > 5) resultMsg += `\n...and ${errorMessages.length - 5} more.`;
    }
    
    alert(resultMsg);
    setIsSendingBulk(false);
    setBulkProgress({ current: 0, total: 0 });
  };

  const payrolls = data?.payrolls || [];

  const filteredPayrolls = payrolls.filter((p: any) => 
    p.userId?.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.userId?.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for ${format(currentDate, 'MMMM yyyy')}?`)) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const result = await res.json();
      alert(`Successfully generated payroll for ${result.count} employees.`);
      mutate();
    } catch (err) {
      alert('Error generating payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!payrolls.length) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Payroll_${format(currentDate, 'MMM_yyyy')}`);
    
    worksheet.columns = [
      { header: 'Employee ID', key: 'empId', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Present Days', key: 'presentDays', width: 15 },
      { header: 'Absent Days', key: 'absentDays', width: 15 },
      { header: 'Gross Salary', key: 'gross', width: 20 },
      { header: 'Deductions', key: 'deductions', width: 20 },
      { header: 'Net Salary', key: 'net', width: 20 },
    ];

    payrolls.forEach((p: any) => {
      worksheet.addRow({
        empId: p.userId?.employeeId,
        name: p.userId?.name,
        workingDays: p.totalWorkingDays,
        presentDays: p.presentDays,
        absentDays: p.absentDays,
        gross: p.monthlySalary,
        deductions: p.deductions,
        net: p.finalSalary,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_${format(currentDate, 'MMM_yyyy')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payroll Management</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage salary, deductions, and payslips.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={handleSendBulkEmail}
            disabled={isSendingBulk || isGenerating || !payrolls.length}
            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            {isSendingBulk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            {isSendingBulk ? `Sending (${bulkProgress.current}/${bulkProgress.total})` : 'Send All'}
          </button>
          <button 
            onClick={handleExport} 
            disabled={isSendingBulk || isGenerating || !payrolls.length}
            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-md hover:bg-neutral-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || isSendingBulk}
            className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            Generate
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-700 rounded-md leading-5 bg-neutral-800 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full sm:w-auto">
            <select 
              className="w-full sm:w-auto block pl-3 pr-10 py-2 text-base border border-neutral-700 bg-neutral-800 text-neutral-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors"
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              value={currentDate.toISOString()}
            >
              {months.map((m, i) => (
                <option key={i} value={m.toISOString()}>{format(m, 'MMMM yyyy')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Working Days</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Present/Absent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Gross Salary</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Deductions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Net Payable</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-neutral-500">Loading...</td></tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                    No payroll data for this month. Click "Generate Payroll" to calculate.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll: any) => {
                  const user = payroll.userId;
                  return (
                    <tr key={payroll._id.toString()} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden border border-neutral-700">
                            {user?.profileImage ? (
                              <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user?.name || 'Unknown'}</div>
                            <div className="text-xs text-neutral-500">{user?.employeeId || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                        {payroll.totalWorkingDays} Days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400">{payroll.presentDays} Present</div>
                        <div className="text-xs text-red-400">{payroll.absentDays} Absent</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-300">
                        ₹{payroll.monthlySalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-medium">
                        -₹{payroll.deductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                        ₹{payroll.finalSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleSendEmail(payroll._id)}
                            disabled={sendingEmail === payroll._id || isSendingBulk}
                            className="text-green-400 hover:text-green-300 transition-colors bg-green-500/10 px-3 py-1.5 rounded-md border border-green-500/20 flex items-center disabled:opacity-50"
                          >
                            {sendingEmail === payroll._id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Mail className="h-4 w-4 mr-1.5" />}
                            Email
                          </button>
                          <button className="text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20 flex items-center">
                            <FileText className="h-4 w-4 mr-1.5" />
                            Payslip
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
