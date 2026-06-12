'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, subMonths } from 'date-fns';
import { Search, Download, PlayCircle, FileText, Loader2, User as UserIcon, Mail, X } from 'lucide-react';
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
  const [downloadingPayslip, setDownloadingPayslip] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    // We are now using the modal to view and print the payslip, but if they still want the direct PDF download we can keep it.
    // However, since we added the modal, we will change the button to open the modal instead.
  };

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
      { header: 'Shift', key: 'shift', width: 15 },
      { header: 'Working Pattern', key: 'workingPattern', width: 20 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Present Days', key: 'presentDays', width: 15 },
      { header: 'Absent Days', key: 'absentDays', width: 15 },
      { header: 'Leave Days', key: 'leaveDays', width: 15 },
      { header: 'Weekly Offs', key: 'weeklyOffs', width: 15 },
      { header: 'Gross Salary', key: 'gross', width: 20 },
      { header: 'Deductions', key: 'deductions', width: 20 },
      { header: 'Net Salary', key: 'net', width: 20 },
    ];

    payrolls.forEach((p: any) => {
      worksheet.addRow({
        empId: p.userId?.employeeId,
        name: p.userId?.name,
        shift: p.userId?.shiftId?.shiftName || 'N/A',
        workingPattern: p.userId?.shiftId?.workingDays?.map((d: string) => d.slice(0, 3)).join('-') || 'N/A',
        workingDays: p.totalWorkingDays,
        presentDays: p.presentDays,
        absentDays: p.absentDays,
        leaveDays: p.leaveDays || 0,
        weeklyOffs: p.weeklyOffDays || 0,
        gross: p.grossSalary || p.monthlySalary,
        deductions: p.deductionAmount || p.deductions,
        net: p.netSalary || p.finalSalary,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
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

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col print:hidden">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Shift</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Days (W/P/A/L/WO)</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded block w-max mb-1">
                          {user?.shiftId?.shiftName || 'N/A'}
                        </span>
                        <div className="text-[10px] text-neutral-500">
                          {user?.shiftId?.workingDays?.map((d: string) => d.slice(0, 3)).join('-') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <div className="text-neutral-400">Total Working: <span className="text-neutral-200">{payroll.totalWorkingDays}</span></div>
                          <div className="text-green-400">Present: {payroll.presentDays}</div>
                          <div className="text-red-400">Absent: {payroll.absentDays}</div>
                          <div className="text-pink-400">Leave: {payroll.leaveDays || 0}</div>
                          <div className="text-blue-400">Weekly Off: {payroll.weeklyOffDays || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-300">
                        ₹{(payroll.grossSalary || payroll.monthlySalary).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-medium">
                        -₹{(payroll.deductionAmount ?? payroll.deductions).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                        ₹{(payroll.netSalary || payroll.finalSalary).toLocaleString()}
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
                          <button
                            onClick={() => setSelectedPayslip(payroll)}
                            className="text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20 flex items-center"
                          >
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

      {/* Payslip Modal (Also used for printing) */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 overflow-y-auto print:absolute print:inset-0 print:bg-white print:text-black">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 print:block print:p-0">
            <div className="fixed inset-0 transition-opacity bg-neutral-950/75 backdrop-blur-sm z-0 print:hidden" onClick={() => setSelectedPayslip(null)} />

            <div className="relative z-10 inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white text-neutral-900 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-8 print:shadow-none print:m-0 print:w-full print:max-w-none">

              <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
                <h3 className="text-xl font-bold">Payslip Preview</h3>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" /> Print / PDF
                  </button>
                  <button onClick={() => setSelectedPayslip(null)} className="text-neutral-500 hover:text-neutral-700 p-2">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4 sm:gap-0 border-b-2 border-neutral-200 pb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">PAYSLIP</h1>
                    <p className="text-neutral-500 mt-1 font-medium">{format(new Date(selectedPayslip.year, selectedPayslip.month - 1), 'MMMM yyyy')}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <h2 className="text-xl font-bold text-neutral-900">ACME Corporation</h2>
                    <p className="text-sm text-neutral-500">123 Business Avenue, Tech Park</p>
                    <p className="text-sm text-neutral-500">contact@acme.corp | +1 234 567 890</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Employee Details</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-neutral-500">Employee ID:</div>
                      <div className="font-medium">{selectedPayslip.userId?.employeeId}</div>
                      <div className="text-neutral-500">Name:</div>
                      <div className="font-medium">{selectedPayslip.userId?.name}</div>
                      <div className="text-neutral-500">Department:</div>
                      <div className="font-medium">{selectedPayslip.userId?.department}</div>
                      <div className="text-neutral-500">Designation:</div>
                      <div className="font-medium">{selectedPayslip.userId?.designation}</div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Bank Details</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-neutral-500">Bank Name:</div>
                      <div className="font-medium">{selectedPayslip.userId?.bankName || '-'}</div>
                      <div className="text-neutral-500">Account No:</div>
                      <div className="font-medium">{selectedPayslip.userId?.accountNumber || '-'}</div>
                      <div className="text-neutral-500">IFSC Code:</div>
                      <div className="font-medium">{selectedPayslip.userId?.ifscCode || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-0 text-sm">
                  <div className="text-center sm:px-2">
                    <div className="text-neutral-500 mb-1">Calendar Days</div>
                    <div className="font-bold text-lg">{selectedPayslip.totalCalendarDays || '-'}</div>
                  </div>
                  <div className="text-center sm:px-2 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Working Days</div>
                    <div className="font-bold text-lg">{selectedPayslip.totalWorkingDays}</div>
                  </div>
                  <div className="text-center sm:px-2 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Present</div>
                    <div className="font-bold text-lg text-green-600">{selectedPayslip.presentDays}</div>
                  </div>
                  <div className="text-center sm:px-2 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Absent</div>
                    <div className="font-bold text-lg text-red-600">{selectedPayslip.absentDays}</div>
                  </div>
                  <div className="text-center sm:px-2 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Leave</div>
                    <div className="font-bold text-lg text-pink-600">{selectedPayslip.leaveDays || 0}</div>
                  </div>
                  <div className="text-center sm:px-2 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Weekly Offs</div>
                    <div className="font-bold text-lg text-blue-600">{selectedPayslip.weeklyOffDays || 0}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-100 border-y border-neutral-200">
                        <th className="px-4 py-3 text-left font-bold text-neutral-900">Earnings</th>
                        <th className="px-4 py-3 text-right font-bold text-neutral-900">Amount</th>
                        <th className="px-4 py-3 text-left font-bold text-neutral-900">Deductions</th>
                        <th className="px-4 py-3 text-right font-bold text-neutral-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-200">
                        <td className="px-4 py-3">Basic Salary</td>
                        <td className="px-4 py-3 text-right font-medium">₹{(selectedPayslip.grossSalary || selectedPayslip.monthlySalary).toLocaleString()}</td>
                        <td className="px-4 py-3">Loss of Pay (Absent & Unpaid Leave)</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">-₹{(selectedPayslip.deductionAmount ?? selectedPayslip.deductions).toLocaleString()}</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right"></td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right"></td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 font-bold">
                        <td className="px-4 py-3">Total Earnings</td>
                        <td className="px-4 py-3 text-right">₹{(selectedPayslip.grossSalary || selectedPayslip.monthlySalary).toLocaleString()}</td>
                        <td className="px-4 py-3">Total Deductions</td>
                        <td className="px-4 py-3 text-right text-red-600">-₹{(selectedPayslip.deductionAmount ?? selectedPayslip.deductions).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-100 mt-6">
                  <div className="text-lg text-blue-900 font-medium">Net Salary Payable</div>
                  <div className="text-3xl font-black text-blue-700">₹{(selectedPayslip.netSalary || selectedPayslip.finalSalary).toLocaleString()}</div>
                </div>

                <div className="pt-16 pb-8 flex flex-col sm:flex-row gap-12 sm:gap-0 justify-between items-center px-4 sm:px-12 text-sm text-neutral-500 font-medium">
                  <div className="text-center border-t border-neutral-300 pt-2 w-48">Employer Signature</div>
                  <div className="text-center border-t border-neutral-300 pt-2 w-48">Employee Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
