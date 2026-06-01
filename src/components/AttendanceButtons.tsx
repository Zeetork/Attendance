'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AttendanceButtons() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAction = async (action: 'check-in' | 'check-out') => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const res = await fetch(`/api/attendance/${action}`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.error || 'Action failed');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || `Successfully ${action.replace('-', ' ')}ed`);
        setTimeout(() => setMessage(''), 3000);
        router.refresh();
      }
    } catch (error) {
      setMessage('Network error occurred');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end w-full sm:w-auto">
      <div className="flex space-x-3 relative w-full sm:w-auto">
        <button 
          onClick={() => handleAction('check-in')}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check In'}
        </button>
        <button 
          onClick={() => handleAction('check-out')}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-4 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-md hover:bg-neutral-700 transition-colors shadow-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check Out'}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs w-full text-center sm:text-right ${message.includes('failed') || message.includes('error') || message.includes('Already') || message.includes('Not') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
