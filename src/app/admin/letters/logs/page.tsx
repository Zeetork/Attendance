'use client';

import useSWR from 'swr';
import { Mail, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmailLogsPage() {
  const { data, isLoading } = useSWR('/api/letters/email-logs', fetcher);
  const logs = data?.logs || [];

  if (isLoading) return <div className="text-foreground font-bold text-center p-6">Loading logs...</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <span className="bg-success/20 text-success font-bold px-2 py-1 rounded text-xs flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</span>;
      case 'FAILED': return <span className="bg-destructive/20 text-destructive font-bold px-2 py-1 rounded text-xs flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Failed</span>;
      default: return <span className="bg-warning/20 text-warning font-bold px-2 py-1 rounded text-xs flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30">
        <h2 className="text-lg font-bold tracking-tight text-card-foreground flex items-center">
          <Mail className="w-5 h-5 mr-2 text-primary" />
          Email Delivery Logs
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-card-foreground whitespace-nowrap min-w-[600px]">
          <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Recipient</th>
              <th className="px-6 py-4 font-bold">Template Subject</th>
              <th className="px-6 py-4 font-bold">Sent At</th>
              <th className="px-6 py-4 font-bold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-bold">
                  No email logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-card-foreground">{log.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs font-bold text-muted-foreground">{log.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-card-foreground">
                    {log.subject}
                    <div className="text-xs font-bold text-muted-foreground mt-1">{log.templateId?.templateName}</div>
                  </td>
                  <td className="px-6 py-4">
                    {log.sentAt ? (
                      <div className="flex items-center text-xs">
                        <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                        {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    ) : (
                       <span className="text-muted-foreground font-bold">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'FAILED' && log.errorMessage ? (
                      <span className="text-destructive font-bold text-xs truncate max-w-[200px] block" title={log.errorMessage}>
                        {log.errorMessage}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-bold text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
