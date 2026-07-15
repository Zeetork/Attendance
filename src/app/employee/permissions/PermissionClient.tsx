'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { format, differenceInMinutes, parse } from 'date-fns';
import { Timer, Plus, CheckCircle, XCircle, AlertCircle, Clock, Save, ArrowRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PermissionClient() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: balanceData, mutate: mutateBalance } = useSWR(`/api/employee/permissions/balance?year=${year}&month=${month}`, fetcher);
  const { data: permData, mutate: mutatePerms } = useSWR(`/api/employee/permissions`, fetcher);
  const { data: attData, mutate: mutateAtts } = useSWR(`/api/employee/permissions/attendance-for-compensation?year=${year}&month=${month}`, fetcher);

  const [isApplying, setIsApplying] = useState(false);
  const [formData, setFormData] = useState({ date: '', fromTime: '', toTime: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [compensatePerm, setCompensatePerm] = useState<any>(null);
  const [selectedAttId, setSelectedAttId] = useState('');
  const [usedMinutes, setUsedMinutes] = useState(0);
  const [isCompensating, setIsCompensating] = useState(false);

  const balance = balanceData?.balance || { allowedMinutes: 120, usedMinutes: 0, remainingMinutes: 120 };
  const permissions = permData?.permissions || [];
  const attendances = attData?.attendances || [];

  const pendingCompensationMins = permissions.filter((p: any) => p.status === 'Pending Compensation' || p.status === 'Partially Compensated').reduce((acc: number, curr: any) => acc + (curr.pendingMinutes || 0), 0);
  const fullyCompensatedMins = permissions.reduce((acc: number, curr: any) => acc + (curr.compensatedMinutes || 0), 0);

  const calculatedDuration = useMemo(() => {
    if (!formData.fromTime || !formData.toTime) return 0;
    try {
      const from = parse(formData.fromTime, 'HH:mm', new Date());
      const to = parse(formData.toTime, 'HH:mm', new Date());
      return Math.max(0, differenceInMinutes(to, from));
    } catch {
      return 0;
    }
  }, [formData.fromTime, formData.toTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDuration <= 0) return alert('Duration must be greater than 0');
    if (calculatedDuration > balance.remainingMinutes) return alert('Duration exceeds remaining balance');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employee/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, duration: calculatedDuration })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Permission requested successfully');
      setIsApplying(false);
      setFormData({ date: '', fromTime: '', toTime: '', reason: '' });
      mutatePerms();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompensate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttId || usedMinutes <= 0) return alert('Invalid selection');
    
    setIsCompensating(true);
    try {
      const res = await fetch(`/api/employee/permissions/${compensatePerm._id}/compensate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId: selectedAttId, usedMinutes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Compensated successfully');
      setCompensatePerm(null);
      mutatePerms();
      mutateAtts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCompensating(false);
    }
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permission Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Request short permissions and manage compensations</p>
        </div>
        <button
          onClick={() => setIsApplying(true)}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Request Permission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <div className="text-sm text-muted-foreground font-bold">Monthly Allowance</div>
          <div className="text-2xl font-black mt-1 text-foreground">{formatMins(balance.allowedMinutes)}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <div className="text-sm text-muted-foreground font-bold">Used This Month</div>
          <div className="text-2xl font-black mt-1 text-destructive">{formatMins(balance.usedMinutes)}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <div className="text-sm text-muted-foreground font-bold">Remaining Balance</div>
          <div className="text-2xl font-black mt-1 text-success">{formatMins(balance.remainingMinutes)}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <div className="text-sm text-muted-foreground font-bold">Pending Compensation</div>
          <div className="text-2xl font-black mt-1 text-warning">{formatMins(pendingCompensationMins)}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <div className="text-sm text-muted-foreground font-bold">Compensated</div>
          <div className="text-2xl font-black mt-1 text-primary">{formatMins(fullyCompensatedMins)}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border font-bold">My Permission History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Compensation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((p: any) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-bold">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.fromTime} - {p.toTime}</td>
                  <td className="px-4 py-3 font-bold">{formatMins(p.duration)}</td>
                  <td className="px-4 py-3">{p.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'Approved' || p.status === 'Fully Compensated' ? 'bg-success/10 text-success' :
                      p.status === 'Pending Approval' ? 'bg-warning/10 text-warning' :
                      p.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(p.status === 'Pending Compensation' || p.status === 'Partially Compensated') && (
                      <button 
                        onClick={() => setCompensatePerm(p)}
                        className="text-primary hover:underline font-bold text-xs"
                      >
                        Compensate Now (Pending: {formatMins(p.pendingMinutes)})
                      </button>
                    )}
                    {p.status === 'Fully Compensated' && (
                      <span className="text-success font-bold text-xs"><CheckCircle className="w-3 h-3 inline mr-1" />Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-bold">No permissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isApplying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Request Permission</h3>
              <button onClick={() => setIsApplying(false)} className="text-muted-foreground hover:text-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Date</label>
                <input type="date" required className="w-full border border-border rounded-xl px-3 py-2 bg-background" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">From Time</label>
                  <input type="time" required className="w-full border border-border rounded-xl px-3 py-2 bg-background" value={formData.fromTime} onChange={e => setFormData({...formData, fromTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">To Time</label>
                  <input type="time" required className="w-full border border-border rounded-xl px-3 py-2 bg-background" value={formData.toTime} onChange={e => setFormData({...formData, toTime: e.target.value})} />
                </div>
              </div>
              <div className="bg-muted p-3 rounded-xl flex justify-between items-center text-sm">
                <span className="font-bold text-muted-foreground">Calculated Duration</span>
                <span className={`font-black ${calculatedDuration > balance.remainingMinutes ? 'text-destructive' : 'text-primary'}`}>{formatMins(calculatedDuration)}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Reason</label>
                <textarea required rows={2} className="w-full border border-border rounded-xl px-3 py-2 bg-background" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              <button disabled={isSubmitting || calculatedDuration > balance.remainingMinutes} type="submit" className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {compensatePerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Compensate Permission</h3>
              <button onClick={() => setCompensatePerm(null)} className="text-muted-foreground hover:text-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-4 text-sm bg-muted/30">
              <div className="flex justify-between font-bold mb-2">
                <span>Permission Date: {format(new Date(compensatePerm.date), 'dd MMM yyyy')}</span>
                <span className="text-warning">Pending: {formatMins(compensatePerm.pendingMinutes)}</span>
              </div>
              <p className="text-muted-foreground text-xs">Select an attendance record from below that has available extra time to compensate for this permission.</p>
            </div>
            <form onSubmit={handleCompensate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">Select Attendance</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {attendances.map((att: any) => (
                    <label key={att._id} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedAttId === att._id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="attendanceId" value={att._id} checked={selectedAttId === att._id} onChange={() => { setSelectedAttId(att._id); setUsedMinutes(Math.min(compensatePerm.pendingMinutes, att.availableExtraMinutes)); }} className="text-primary focus:ring-primary" />
                        <div>
                          <div className="font-bold">{format(new Date(att.date), 'dd MMM yyyy')}</div>
                          <div className="text-xs text-muted-foreground">Total Extra: {formatMins(att.totalExtraMinutes)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-success font-bold">{formatMins(att.availableExtraMinutes)} Available</div>
                      </div>
                    </label>
                  ))}
                  {attendances.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground font-bold border border-dashed border-border rounded-xl">
                      No attendance records with extra time found this month.
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAttId && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Minutes to Use (Max: {Math.min(compensatePerm.pendingMinutes, attendances.find((a: any) => a._id === selectedAttId)?.availableExtraMinutes || 0)})</label>
                  <input 
                    type="number" 
                    required 
                    min={1} 
                    max={Math.min(compensatePerm.pendingMinutes, attendances.find((a: any) => a._id === selectedAttId)?.availableExtraMinutes || 0)}
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background font-bold" 
                    value={usedMinutes} 
                    onChange={e => setUsedMinutes(Number(e.target.value))} 
                  />
                </div>
              )}

              <button disabled={isCompensating || !selectedAttId || usedMinutes <= 0} type="submit" className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50">
                {isCompensating ? 'Processing...' : 'Confirm Compensation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
