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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Payslips</h1>
          <p className="text-sm text-muted-foreground mt-1">View and download your monthly salary slips.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {isLoading ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse"></div>
          ))
        ) : payslips.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
            No payslips available yet.
          </div>
        ) : (
          payslips.map((payslip: any) => {
            const date = new Date(payslip.year, payslip.month - 1);
            return (
              <div key={payslip._id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors group flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success/10 rounded-xl text-success group-hover:bg-success/20 transition-colors">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground text-lg group-hover:text-primary transition-colors">{format(date, 'MMMM yyyy')}</h3>
                      <p className="text-xs text-muted-foreground">Generated: {format(new Date(payslip.generatedAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Salary</span>
                    <span className="text-card-foreground font-bold">₹{payslip.monthlySalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="text-destructive font-bold">-₹{payslip.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
                    <span className="text-card-foreground">Net Payable</span>
                    <span className="text-success">₹{payslip.finalSalary.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPayslip(payslip)}
                  className="w-full flex items-center justify-center px-4 py-2 min-h-[44px] bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors border border-border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-sm z-0 print:hidden" onClick={() => setSelectedPayslip(null)} />

            <div className="relative z-10 inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-card text-card-foreground rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:p-8 print:shadow-none print:m-0 print:w-full print:max-w-none animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center mb-8 print:hidden border-b border-border pb-4">
                <h3 className="text-xl font-bold">Payslip Preview</h3>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Download className="w-4 h-4 mr-2" /> Print / PDF
                  </button>
                  <button onClick={() => setSelectedPayslip(null)} className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-accent transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4 sm:gap-0 border-b-2 border-border pb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">PAYSLIP</h1>
                    <p className="text-muted-foreground mt-1 font-bold">{format(new Date(selectedPayslip.year, selectedPayslip.month - 1), 'MMMM yyyy')}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <h2 className="text-xl font-bold text-card-foreground">ACME Corporation</h2>
                    <p className="text-sm text-muted-foreground">123 Business Avenue, Tech Park</p>
                    <p className="text-sm text-muted-foreground">contact@acme.corp | +1 234 567 890</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                    <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider mb-4">Employee Details</h3>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-muted-foreground font-medium">Employee ID:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.employeeId}</div>
                      <div className="text-muted-foreground font-medium">Name:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.name}</div>
                      <div className="text-muted-foreground font-medium">Department:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.department}</div>
                      <div className="text-muted-foreground font-medium">Designation:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.designation}</div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                    <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider mb-4">Bank Details</h3>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-muted-foreground font-medium">Bank Name:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.bankName || '-'}</div>
                      <div className="text-muted-foreground font-medium">Account No:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.accountNumber || '-'}</div>
                      <div className="text-muted-foreground font-medium">IFSC Code:</div>
                      <div className="font-bold text-right">{selectedPayslip.userId?.ifscCode || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-5 rounded-2xl border border-border grid grid-cols-2 sm:flex sm:justify-between gap-4 sm:gap-0 text-sm">
                  <div className="text-center sm:px-4">
                    <div className="text-muted-foreground font-medium mb-1">Total Days</div>
                    <div className="font-black text-xl">{selectedPayslip.totalWorkingDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-border">
                    <div className="text-muted-foreground font-medium mb-1">Present</div>
                    <div className="font-black text-xl text-success">{selectedPayslip.presentDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-border">
                    <div className="text-muted-foreground font-medium mb-1">Absent</div>
                    <div className="font-black text-xl text-destructive">{selectedPayslip.absentDays}</div>
                  </div>
                  <div className="text-center sm:px-4 sm:border-l border-border">
                    <div className="text-muted-foreground font-medium mb-1">Half Days</div>
                    <div className="font-black text-xl text-warning">{selectedPayslip.halfDays}</div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="min-w-full w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-5 py-4 text-left font-bold text-card-foreground">Earnings</th>
                      <th className="px-5 py-4 text-right font-bold text-card-foreground">Amount</th>
                      <th className="px-5 py-4 text-left font-bold text-card-foreground">Deductions</th>
                      <th className="px-5 py-4 text-right font-bold text-card-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-5 py-4 font-medium">Basic Salary</td>
                      <td className="px-5 py-4 text-right font-bold">₹{selectedPayslip.monthlySalary.toLocaleString()}</td>
                      <td className="px-5 py-4 font-medium">Loss of Pay (Absent)</td>
                      <td className="px-5 py-4 text-right font-bold text-destructive">-₹{selectedPayslip.deductions.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-5 py-4"></td>
                      <td className="px-5 py-4 text-right"></td>
                      <td className="px-5 py-4"></td>
                      <td className="px-5 py-4 text-right"></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-5 py-4">Total Earnings</td>
                      <td className="px-5 py-4 text-right text-lg">₹{selectedPayslip.monthlySalary.toLocaleString()}</td>
                      <td className="px-5 py-4">Total Deductions</td>
                      <td className="px-5 py-4 text-right text-lg text-destructive">-₹{selectedPayslip.deductions.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-8 rounded-2xl border border-primary/20 mt-6">
                  <div className="text-lg text-primary font-bold">Net Salary Payable</div>
                  <div className="text-4xl font-black text-primary">₹{selectedPayslip.finalSalary.toLocaleString()}</div>
                </div>
                
                <div className="pt-16 pb-8 flex flex-col sm:flex-row gap-12 sm:gap-0 justify-between items-center px-4 sm:px-12 text-sm text-muted-foreground font-bold">
                  <div className="text-center border-t-2 border-border pt-4 w-48">Employer Signature</div>
                  <div className="text-center border-t-2 border-border pt-4 w-48">Employee Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
