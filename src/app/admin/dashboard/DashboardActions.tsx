'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Bell, Clock, LogOut, FileText } from 'lucide-react';
import WebPushModal from '@/components/WebPushModal';

export default function DashboardActions() {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  const handleReminder = async (type: 'check-in' | 'check-out') => {
    setLoadingType(type);
    try {
      const res = await fetch('/api/attendance/reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.message ||
            `${type === 'check-in' ? 'Check-In' : 'Check-Out'} reminders processed for ${data.sentTo?.length || 0} employee(s). Push notifications: ${data.pushCount || 0}.`
        );
      } else {
        toast.error(data.error || 'Failed to send reminder');
      }
    } catch (error) {
      toast.error('An error occurred while sending reminders');
      console.error(error);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center w-full sm:w-auto gap-2.5">
        {/* Test / Custom Web Push Notification */}
        <button
          onClick={() => setIsPushModalOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-card hover:bg-muted border border-border text-foreground rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <Bell className="h-4 w-4 text-primary" />
          <span>Web Push Test</span>
        </button>

        {/* Check In Reminder Button */}
        <button
          onClick={() => handleReminder('check-in')}
          disabled={loadingType === 'check-in'}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
        >
          <Clock className="h-4 w-4" />
          <span>{loadingType === 'check-in' ? 'Sending...' : 'Check In Reminder'}</span>
        </button>

        {/* Check Out Reminder Button */}
        <button
          onClick={() => handleReminder('check-out')}
          disabled={loadingType === 'check-out'}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{loadingType === 'check-out' ? 'Sending...' : 'Check Out Reminder'}</span>
        </button>

        {/* Payroll */}
        <button
          onClick={() => router.push('/admin/payroll')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <FileText className="h-4 w-4" />
          <span>Generate Payroll</span>
        </button>
      </div>

      <WebPushModal isOpen={isPushModalOpen} onClose={() => setIsPushModalOpen(false)} />
    </>
  );
}
