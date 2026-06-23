'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-warning">
          <AlertTriangle className="w-6 h-6" />
          <h3 id="modal-title" className="text-lg font-bold text-card-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6 font-medium">{message}</p>
        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center min-h-[44px] shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AttendanceButtons() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'check-in' | 'check-out' | null>(null);

  const executeAction = async () => {
    if (!confirmAction) return;

    setIsLoading(true);
    const toastId = toast.loading(`${confirmAction === 'check-in' ? 'Checking in' : 'Checking out'}...`);

    try {
      const res = await fetch(`/api/attendance/${confirmAction}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Action failed', { id: toastId });
      } else {
        toast.success(data.message || `Successfully ${confirmAction.replace('-', ' ')}ed`, { id: toastId });
        router.refresh();
      }
    } catch (error) {
      toast.error('Network error occurred', { id: toastId });
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="flex flex-col items-end w-full sm:w-auto font-sans relative">
      <ConfirmModal 
        isOpen={!!confirmAction}
        title={confirmAction === 'check-in' ? "Confirm Check In" : "Confirm Check Out"}
        message={confirmAction === 'check-in' ? "Are you sure you want to check in? Make sure you are at the correct location." : "Are you sure you want to check out? This action cannot be undone for today."}
        isLoading={isLoading}
        onConfirm={executeAction}
        onCancel={() => setConfirmAction(null)}
      />

      <div className="flex gap-3 relative w-full sm:w-auto">
        <button
          onClick={() => setConfirmAction('check-in')}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-bold disabled:opacity-50 flex items-center justify-center min-w-[120px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Check In
        </button>
        <button
          onClick={() => setConfirmAction('check-out')}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-secondary text-secondary-foreground border border-border rounded-xl hover:bg-secondary/80 transition-all shadow-sm font-bold disabled:opacity-50 flex items-center justify-center min-w-[120px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Check Out
        </button>
      </div>
    </div>
  );
}
