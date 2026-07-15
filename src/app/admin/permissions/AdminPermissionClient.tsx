'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminPermissionClient() {
  const { data, mutate } = useSWR('/api/admin/permissions', fetcher);
  const permissions = data?.permissions || [];
  
  const [activeTab, setActiveTab] = useState<'Approvals' | 'Reports'>('Approvals');
  const [reportDate, setReportDate] = useState(new Date());
  const year = reportDate.getFullYear();
  const month = reportDate.getMonth() + 1;
  
  const { data: reportData, isLoading: isReportLoading } = useSWR(activeTab === 'Reports' ? `/api/admin/permissions/reports?year=${year}&month=${month}` : null, fetcher);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this permission?`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/permissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Permission ${status.toLowerCase()} successfully`);
      mutate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
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
          <h1 className="text-2xl font-bold text-foreground">Manage Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Review employee permission requests and monitor compensations.</p>
        </div>
        
        {activeTab === 'Reports' && (
          <input 
            type="month" 
            value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setReportDate(new Date(parseInt(y), parseInt(m) - 1, 1));
              }
            }}
            className="px-4 py-2 rounded-xl border border-border bg-card text-card-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />
        )}
      </div>

      <div className="flex space-x-1 border-b border-border mb-4">
        {['Approvals', 'Reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Approvals' ? (

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-bold text-left tracking-wider">Employee</th>
                <th className="px-6 py-3 font-bold text-left tracking-wider">Date & Time</th>
                <th className="px-6 py-3 font-bold text-left tracking-wider">Duration</th>
                <th className="px-6 py-3 font-bold text-left tracking-wider">Reason</th>
                <th className="px-6 py-3 font-bold text-left tracking-wider">Status</th>
                <th className="px-6 py-3 font-bold text-right tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {permissions.map((p: any) => (
                <tr key={p._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-card-foreground text-sm">{p.userId?.name}</div>
                    <div className="text-xs text-muted-foreground font-bold">{p.userId?.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-sm text-card-foreground">{format(new Date(p.date), 'dd MMM yyyy')}</div>
                    <div className="text-xs text-muted-foreground font-bold">{p.fromTime} - {p.toTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-card-foreground">
                    {formatMins(p.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate" title={p.reason}>
                    {p.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'Approved' || p.status === 'Fully Compensated' ? 'bg-success/10 text-success' :
                      p.status === 'Pending Approval' ? 'bg-warning/10 text-warning' :
                      p.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {p.status === 'Pending Approval' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleStatusUpdate(p._id, 'Approved')}
                          className="text-success hover:bg-success/10 p-2 rounded-xl transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleStatusUpdate(p._id, 'Rejected')}
                          className="text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs font-bold">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-bold">No permissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="space-y-8">
          {isReportLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-40 bg-card rounded-xl border border-border"></div>
              <div className="h-40 bg-card rounded-xl border border-border"></div>
            </div>
          ) : (
            <>
              {/* Permission Report */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-4 overflow-hidden">
                <h3 className="font-bold text-lg mb-4">Permission Balance Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold">Employee</th>
                        <th className="px-4 py-2 text-right font-bold">Allowed</th>
                        <th className="px-4 py-2 text-right font-bold">Used</th>
                        <th className="px-4 py-2 text-right font-bold">Remaining</th>
                        <th className="px-4 py-2 text-right font-bold">Pending Comp.</th>
                        <th className="px-4 py-2 text-right font-bold">Compensated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData?.permissionReport?.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{r.employee} <span className="text-xs text-muted-foreground">({r.employeeId})</span></td>
                          <td className="px-4 py-2 text-right text-sm font-medium">{formatMins(r.allowed)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-destructive">{formatMins(r.used)}</td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-success">{formatMins(r.remaining)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-warning">{formatMins(r.pending)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-primary">{formatMins(r.compensated)}</td>
                        </tr>
                      ))}
                      {(!reportData?.permissionReport || reportData.permissionReport.length === 0) && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data found for this month</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Compensation */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-4 overflow-hidden">
                <h3 className="font-bold text-lg mb-4">Pending Compensations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold">Employee</th>
                        <th className="px-4 py-2 text-left font-bold">Perm. Date</th>
                        <th className="px-4 py-2 text-right font-bold">Duration</th>
                        <th className="px-4 py-2 text-right font-bold">Pending</th>
                        <th className="px-4 py-2 text-right font-bold">Days Remaining</th>
                        <th className="px-4 py-2 text-right font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData?.pendingReport?.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{r.employee}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{format(new Date(r.permissionDate), 'dd MMM yyyy')}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium">{formatMins(r.duration)}</td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-warning">{formatMins(r.pendingMinutes)}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-destructive">{r.daysRemaining} days</td>
                          <td className="px-4 py-2 text-right text-xs"><span className="bg-warning/10 text-warning px-2 py-1 rounded-md font-bold">{r.status}</span></td>
                        </tr>
                      ))}
                      {(!reportData?.pendingReport || reportData.pendingReport.length === 0) && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No pending compensations</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compensation Audit */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-4 overflow-hidden">
                <h3 className="font-bold text-lg mb-4">Compensation Audit Log</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold">Employee</th>
                        <th className="px-4 py-2 text-left font-bold">Permission Date</th>
                        <th className="px-4 py-2 text-left font-bold">Attendance Compensated</th>
                        <th className="px-4 py-2 text-right font-bold">Perm. Mins</th>
                        <th className="px-4 py-2 text-right font-bold">Used Mins</th>
                        <th className="px-4 py-2 text-right font-bold">Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData?.auditReport?.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{r.employee}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{format(new Date(r.permissionDate), 'dd MMM yyyy')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{r.attendanceDate ? format(new Date(r.attendanceDate), 'dd MMM yyyy') : 'N/A'}</td>
                          <td className="px-4 py-2 text-right text-sm font-medium">{formatMins(r.permissionMinutes)}</td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-success">{formatMins(r.usedMinutes)}</td>
                          <td className="px-4 py-2 text-right text-sm"><CheckCircle className="w-4 h-4 text-success inline" /></td>
                        </tr>
                      ))}
                      {(!reportData?.auditReport || reportData.auditReport.length === 0) && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No audit logs found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
