'use client';

import useSWR from 'swr';
import { Mail, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmailLogsPage() {
  const { data, isLoading } = useSWR('/api/letters/email-logs', fetcher);
  const logs = data?.logs || [];

  if (isLoading) return <div className="text-white p-6">Loading logs...</div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</span>;
      case 'FAILED': return <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Failed</span>;
      default: return <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Mail className="w-5 h-5 mr-2 text-blue-400" />
          Email Delivery Logs
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs uppercase bg-neutral-800/80 text-neutral-300 border-b border-neutral-700">
            <tr>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Recipient</th>
              <th className="px-6 py-4 font-medium">Template Subject</th>
              <th className="px-6 py-4 font-medium">Sent At</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  No email logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{log.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs text-neutral-500">{log.email}</div>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {log.subject}
                    <div className="text-xs text-neutral-500 mt-1">{log.templateId?.templateName}</div>
                  </td>
                  <td className="px-6 py-4">
                    {log.sentAt ? (
                      <div className="flex items-center text-xs">
                        <Calendar className="w-3 h-3 mr-2 text-neutral-500" />
                        {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    ) : (
                       <span className="text-neutral-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'FAILED' && log.errorMessage ? (
                      <span className="text-red-400 text-xs truncate max-w-[200px] block" title={log.errorMessage}>
                        {log.errorMessage}
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-xs">N/A</span>
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
