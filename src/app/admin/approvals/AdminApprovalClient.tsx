'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch');
  return json;
};

export default function AdminApprovalClient() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/approvals', fetcher);
  const [acting, setActing] = useState<string | null>(null);
  const [editedTimes, setEditedTimes] = useState<Record<string, { checkIn?: string, checkOut?: string }>>({});

  if (error) return <div className="text-red-500">Failed to load approvals.</div>;

  const handleTimeChange = (id: string, field: 'checkIn' | 'checkOut', value: string) => {
    setEditedTimes(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleAction = async (id: string, requestType: string, status: 'approved' | 'rejected', dateStr?: string) => {
    setActing(id);
    try {
      const payload: any = { id, requestType, status };
      
      if (status === 'approved' && (requestType === 'MISS_PUNCH' || requestType === 'ATTENDANCE_CORRECTION')) {
        const customCheckIn = editedTimes[id]?.checkIn;
        const customCheckOut = editedTimes[id]?.checkOut;
        
        if (customCheckIn && dateStr) {
          payload.finalCheckIn = new Date(`${format(new Date(dateStr), 'yyyy-MM-dd')}T${customCheckIn}:00`);
        }
        if (customCheckOut && dateStr) {
          payload.finalCheckOut = new Date(`${format(new Date(dateStr), 'yyyy-MM-dd')}T${customCheckOut}:00`);
        }
      }

      const res = await fetch('/api/approvals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to process request');
      toast.success(json.message);
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActing(null);
    }
  };

  const renderDetails = (req: any) => {
    switch (req.requestType) {
      case 'LEAVE':
        return (
          <>
            <p className="text-sm text-neutral-300">Type: {req.leaveType}</p>
            <p className="text-sm text-neutral-400">Date: {format(new Date(req.fromDate), 'MMM dd')} - {format(new Date(req.toDate), 'MMM dd, yyyy')}</p>
            {req.attachments && req.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-neutral-500 mb-1">Supporting Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {req.attachments.map((file: string, index: number) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-400 hover:underline bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded transition-colors"
                    >
                      View Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      case 'MISS_PUNCH':
      case 'ATTENDANCE_CORRECTION':
        const isMissPunch = req.requestType === 'MISS_PUNCH';
        const initialCheckIn = req.requestedCheckIn ? format(new Date(req.requestedCheckIn), 'HH:mm') : '';
        const initialCheckOut = req.requestedCheckOut ? format(new Date(req.requestedCheckOut), 'HH:mm') : '';
        const currentCheckIn = editedTimes[req._id]?.checkIn !== undefined ? editedTimes[req._id].checkIn : initialCheckIn;
        const currentCheckOut = editedTimes[req._id]?.checkOut !== undefined ? editedTimes[req._id].checkOut : initialCheckOut;

        return (
          <>
            <p className="text-sm text-neutral-300">{isMissPunch ? `Type: ${req.subType}` : 'Requested Correction'}</p>
            <p className="text-sm text-neutral-400 mb-2">Date: {format(new Date(req.date || req.currentCheckIn || new Date()), 'MMM dd, yyyy')}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 w-full sm:w-fit">
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Check In</label>
                <input 
                  type="time" 
                  className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none" 
                  value={currentCheckIn}
                  onChange={(e) => handleTimeChange(req._id, 'checkIn', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Check Out</label>
                <input 
                  type="time" 
                  className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none" 
                  value={currentCheckOut}
                  onChange={(e) => handleTimeChange(req._id, 'checkOut', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">* You can modify these times before approving.</p>
          </>
        );
      case 'OVERTIME':
        return (
          <>
            <p className="text-sm text-neutral-300">Hours: {req.hours}</p>
            <p className="text-sm text-neutral-400">Date: {format(new Date(req.date), 'MMM dd, yyyy')}</p>
          </>
        );
      case 'WFH':
        return (
          <>
            <p className="text-sm text-neutral-300">Work From Home</p>
            <p className="text-sm text-neutral-400">Date: {format(new Date(req.fromDate), 'MMM dd')} - {format(new Date(req.toDate), 'MMM dd, yyyy')}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Approval Center</h1>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Pending Approvals
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-800 animate-pulse rounded w-full"></div>)}
          </div>
        ) : data?.approvals?.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl">
            <CheckCircle className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-neutral-400">All caught up!</h3>
            <p className="text-neutral-500">There are no pending requests to review.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {data?.approvals?.map((req: any) => (
              <div key={req._id} className="p-4 bg-neutral-800/40 rounded-lg border border-neutral-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{req.employee?.name}</span>
                    <span className="text-xs text-neutral-500">({req.employee?.employeeId})</span>
                    <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 whitespace-nowrap">
                      {req.requestType.replace('_', ' ')}
                    </span>
                  </div>
                  {renderDetails(req)}
                  <p className="text-sm text-neutral-400 mt-2"><span className="text-neutral-500">Reason:</span> {req.reason}</p>
                </div>
                
                <div className="flex w-full sm:w-auto items-center gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleAction(req._id, req.requestType, 'approved', req.date || req.currentCheckIn || req.requestedCheckIn)}
                    disabled={acting === req._id}
                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(req._id, req.requestType, 'rejected')}
                    disabled={acting === req._id}
                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
