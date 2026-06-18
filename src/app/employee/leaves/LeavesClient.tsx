'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Plus, X, CheckCircle, XCircle, Clock, Loader2, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EmployeeLeavesClient() {
  const { data, error, isLoading, mutate } = useSWR('/api/employee/leaves', fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    duration: 'full_day',
    halfDaySession: '',
    reason: '',
    attachments: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to apply');
      }
      
      mutate();
      setIsModalOpen(false);
      setFormData({ leaveType: '', fromDate: '', toDate: '', duration: 'full_day', halfDaySession: '', reason: '', attachments: [] });
      toast.success('Leave applied successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error applying for leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    Promise.all(files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })).then(base64Files => {
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...base64Files] }));
    });
  };

  const leaves = data?.leaves || [];
  const balanceData = data?.balance;
  
  // Calculate total taken days across all paid leave types
  const takenDays = balanceData ? (balanceData.casualLeave.taken + balanceData.sickLeave.taken + balanceData.restrictedLeave.taken) : 0;
  
  // Calculate total available balance across all paid leave types
  const availableBalance = balanceData ? (
    balanceData.casualLeave.available + 
    balanceData.sickLeave.available + 
    balanceData.restrictedLeave.available + 
    balanceData.compensatoryOff.available
  ) : 0;
  
  const totalAllowance = balanceData ? (balanceData.casualLeave.total + balanceData.sickLeave.total + balanceData.restrictedLeave.total) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center w-fit"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leave Management</h1>
          <p className="text-sm text-neutral-400 mt-1">View your leave balances and history.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Summary Cards */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-neutral-400 font-medium mb-2">Casual Leave</div>
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-white">{balanceData?.casualLeave.available ?? '-'}</div>
            <div className="text-xs text-neutral-500">Taken: {balanceData?.casualLeave.taken ?? '-'}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-neutral-400 font-medium mb-2">Sick Leave</div>
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-white">{balanceData?.sickLeave.available ?? '-'}</div>
            <div className="text-xs text-neutral-500">Taken: {balanceData?.sickLeave.taken ?? '-'}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-neutral-400 font-medium mb-2">Restricted Holiday</div>
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-white">{balanceData?.restrictedLeave.available ?? '-'}</div>
            <div className="text-xs text-neutral-500">Taken: {balanceData?.restrictedLeave.taken ?? '-'}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-neutral-400 font-medium mb-2">Compensatory Off</div>
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-white">{balanceData?.compensatoryOff.available ?? '-'}</div>
            <div className="text-xs text-neutral-500">Taken: {balanceData?.compensatoryOff.taken ?? '-'}</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-neutral-400 font-medium mb-2">Leave Without Pay</div>
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold text-neutral-400">{balanceData?.leaveWithoutPay.taken ?? '-'}</div>
            <div className="text-xs text-neutral-500">Taken</div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-medium text-white">Leave History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500">Loading...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500">No leave history found.</td></tr>
              ) : (
                leaves.map((leave: any) => {
                  const days = Math.round((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={leave._id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {leave.leaveType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-300">{format(new Date(leave.fromDate), 'MMM dd, yyyy')} {leave.duration === 'multiple_days' ? `- ${format(new Date(leave.toDate), 'MMM dd, yyyy')}` : ''}</div>
                        <div className="text-xs text-neutral-500">{leave.numberOfDays || days} Day{(leave.numberOfDays || days) !== 1 && 's'} {leave.duration === 'half_day' && `(${leave.halfDaySession === 'first_half' ? 'First Half' : 'Second Half'})`}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300 max-w-xs truncate" title={leave.reason}>{leave.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                        {format(new Date(leave.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(leave.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-neutral-950/75 backdrop-blur-sm z-0" onClick={() => !isSubmitting && setIsModalOpen(false)} />

            <div className="relative z-10 inline-block w-full max-w-md px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
              <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white">Apply for Leave</h3>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Leave Type</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.leaveType}
                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                  >
                    <option value="" disabled>-- Select Leave Type --</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Compensatory Off">Compensatory Off</option>
                    <option value="Restricted Holiday">Restricted Holiday</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Leave Without Pay">Leave Without Pay</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                      value={formData.fromDate}
                      onChange={(e) => {
                        const newFromDate = e.target.value;
                        setFormData(prev => ({
                          ...prev, 
                          fromDate: newFromDate,
                          toDate: prev.duration === 'half_day' || prev.duration === 'full_day' ? newFromDate : prev.toDate
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      disabled={formData.duration === 'half_day' || formData.duration === 'full_day'}
                      min={formData.fromDate || format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark] disabled:opacity-50"
                      value={formData.duration === 'half_day' || formData.duration === 'full_day' ? formData.fromDate : formData.toDate}
                      onChange={(e) => setFormData({...formData, toDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Duration</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.duration}
                      onChange={(e) => {
                        const dur = e.target.value;
                        setFormData(prev => ({
                          ...prev, 
                          duration: dur, 
                          halfDaySession: dur === 'half_day' ? 'first_half' : '',
                          toDate: dur === 'half_day' || dur === 'full_day' ? prev.fromDate : prev.toDate
                        }));
                      }}
                    >
                      <option value="full_day">Full Day</option>
                      <option value="half_day">Half Day</option>
                      <option value="multiple_days">Multiple Days</option>
                    </select>
                  </div>

                  {formData.duration === 'half_day' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Session</label>
                      <select
                        required
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.halfDaySession}
                        onChange={(e) => setFormData({...formData, halfDaySession: e.target.value})}
                      >
                        <option value="first_half">First Half (Morning)</option>
                        <option value="second_half">Second Half (Afternoon)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Reason</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Briefly describe the reason for your leave..."
                  ></textarea>
                </div>

                <div className="bg-neutral-800/50 p-3 rounded-md border border-neutral-700/50">
                  <div className="text-sm text-neutral-400">Total Leave Count:</div>
                  <div className="text-lg font-semibold text-white">
                    {formData.duration === 'half_day' 
                      ? '0.5 Day' 
                      : (formData.fromDate && (formData.duration === 'full_day' ? formData.fromDate : formData.toDate) && new Date(formData.duration === 'full_day' ? formData.fromDate : formData.toDate) >= new Date(formData.fromDate) 
                          ? `${Math.ceil((new Date(formData.duration === 'full_day' ? formData.fromDate : formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Day(s)` 
                          : '0 Day')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Supporting Documents</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 text-sm"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Medical certificate required for Sick Leave &gt; 4 days.</p>
                  {formData.attachments.length > 0 && (
                    <div className="mt-2 text-sm text-green-500">{formData.attachments.length} file(s) attached</div>
                  )}
                </div>

                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-neutral-800 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
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
