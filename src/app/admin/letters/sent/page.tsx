'use client';

import useSWR from 'swr';
import { Download, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SentLettersPage() {
  const { data, isLoading } = useSWR('/api/letters/history', fetcher);
  const history = data?.history || [];

  if (isLoading) return <div className="text-white p-6">Loading history...</div>;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-800/50">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-400" />
          Generated Letters History
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400 whitespace-nowrap min-w-[600px]">
          <thead className="text-xs uppercase bg-neutral-800/80 text-neutral-300 border-b border-neutral-700">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Template</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Generated On</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  No letters have been generated yet.
                </td>
              </tr>
            ) : (
              history.map((record: any) => (
                <tr key={record._id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{record.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs text-neutral-500">{record.employeeId?.designation}</div>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {record.templateId?.templateName || 'Unknown Template'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded text-xs">
                      {record.templateId?.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2 text-neutral-500" />
                      {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Re-download button is not fully implemented since we didn't save the PDF to S3 in the backend yet. */}
                    <button className="text-blue-400 hover:text-blue-300 flex items-center justify-end w-full" title="Re-download coming soon">
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
