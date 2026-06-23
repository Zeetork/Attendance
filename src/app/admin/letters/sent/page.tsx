'use client';

import useSWR from 'swr';
import { Download, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SentLettersPage() {
  const { data, isLoading } = useSWR('/api/letters/history', fetcher);
  const history = data?.history || [];

  if (isLoading) return <div className="text-foreground font-bold text-center p-6">Loading history...</div>;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30">
        <h2 className="text-lg font-bold tracking-tight text-card-foreground flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          Generated Letters History
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-card-foreground whitespace-nowrap min-w-[600px]">
          <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold">Employee</th>
              <th className="px-6 py-4 font-bold">Template</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Generated On</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-bold">
                  No letters have been generated yet.
                </td>
              </tr>
            ) : (
              history.map((record: any) => (
                <tr key={record._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-card-foreground">{record.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs font-bold text-muted-foreground">{record.employeeId?.designation}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-card-foreground">
                    {record.templateId?.templateName || 'Unknown Template'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/20 text-primary font-bold px-2.5 py-0.5 rounded text-xs">
                      {record.templateId?.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                      {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Re-download button is not fully implemented since we didn't save the PDF to S3 in the backend yet. */}
                    <button className="text-primary hover:text-primary/80 font-bold flex items-center justify-end w-full" title="Re-download coming soon">
                      <Download className="w-4 h-4 mr-1" />
                      <span className="text-xs">Download</span>
                    </button>
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
