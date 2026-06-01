'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { FileText, Download, DollarSign, Loader2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PayslipsClient() {
  const { data, error, isLoading } = useSWR('/api/employee/payslips', fetcher);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const payslips = data?.payrolls || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Payslips</h1>
          <p className="text-sm text-neutral-400 mt-1">View and download your monthly salary slips.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {isLoading ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-48 animate-pulse"></div>
          ))
        ) : payslips.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900 rounded-xl border border-neutral-800">
            No payslips available yet.
          </div>
        ) : (
          payslips.map((payslip: any) => {
            const date = new Date(payslip.year, payslip.month - 1);
            return (
              <div key={payslip._id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{format(date, 'MMMM yyyy')}</h3>
                      <p className="text-xs text-neutral-400">Generated: {format(new Date(payslip.generatedAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Gross Salary</span>
                    <span className="text-white font-medium">₹{payslip.monthlySalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Deductions</span>
                    <span className="text-red-400 font-medium">-₹{payslip.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-neutral-800 pt-2 mt-2">
                    <span className="text-neutral-300">Net Payable</span>
                    <span className="text-green-400">₹{payslip.finalSalary.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPayslip(payslip)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-700 text-sm font-medium"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Payslip
                </button>
              </div>
            );
          })
        )}
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

                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 grid grid-cols-2 sm:flex sm:justify-between gap-4 sm:gap-0 text-sm">
                  <div className="text-center sm:px-4">
                    <div className="text-neutral-500 mb-1">Total Days</div>
                    <div className="font-bold text-lg">{selectedPayslip.totalWorkingDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Present</div>
                    <div className="font-bold text-lg text-green-600">{selectedPayslip.presentDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Absent</div>
                    <div className="font-bold text-lg text-red-600">{selectedPayslip.absentDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-neutral-200">
                    <div className="text-neutral-500 mb-1">Half Days</div>
                    <div className="font-bold text-lg text-amber-600">{selectedPayslip.halfDays}</div>
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
                      <td className="px-4 py-3 text-right font-medium">₹{selectedPayslip.monthlySalary.toLocaleString()}</td>
                      <td className="px-4 py-3">Loss of Pay (Absent)</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">-₹{selectedPayslip.deductions.toLocaleString()}</td>
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
                      <td className="px-4 py-3 text-right">₹{selectedPayslip.monthlySalary.toLocaleString()}</td>
                      <td className="px-4 py-3">Total Deductions</td>
                      <td className="px-4 py-3 text-right text-red-600">-₹{selectedPayslip.deductions.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-100 mt-6">
                  <div className="text-lg text-blue-900 font-medium">Net Salary Payable</div>
                  <div className="text-3xl font-black text-blue-700">₹{selectedPayslip.finalSalary.toLocaleString()}</div>
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
