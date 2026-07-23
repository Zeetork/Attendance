'use client';

import useSWR from 'swr';
import { Download, FileText, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SentLettersPage() {
  const { data, isLoading, mutate } = useSWR('/api/letters/history', fetcher);
  const history = data?.history || [];

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this letter? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/letters/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete letter');
      }
      toast.success('Letter deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button 
                        onClick={() => window.open(`/api/letters/${record._id}/download`, '_blank')}
                        className="text-primary hover:text-primary/80 font-bold flex items-center transition-colors" 
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        <span className="text-xs">Download</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(record._id)}
                        className="text-destructive hover:text-destructive/80 font-bold flex items-center transition-colors" 
                        title="Delete Letter"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-xs">Delete</span>
                      </button>
                    </div>
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
