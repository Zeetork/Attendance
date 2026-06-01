'use client';

import { User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

export default function ReportingStructure({ manager, currentUser, subordinates, isLoading, todayAttendance }: any) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState('00 : 00 : 00');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!todayAttendance?.loginTime || todayAttendance?.logoutTime) {
      setElapsed('00 : 00 : 00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const login = new Date(todayAttendance.loginTime).getTime();
      const diff = Math.max(0, now - login);

      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

      setElapsed(`${hours} : ${mins} : ${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayAttendance]);

  const handleAttendanceAction = async (action: 'check-in' | 'check-out') => {
    setIsActionLoading(true);
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
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-white animate-pulse rounded-xl shadow w-full"></div>
        <div className="h-24 bg-white animate-pulse rounded-xl shadow w-full"></div>
        <div className="h-32 bg-white animate-pulse rounded-xl shadow w-full"></div>
      </div>
    );
  }

  // Fallback for avatar
  const Avatar = ({ src, alt, size = "md" }: { src?: string, alt?: string, size?: "sm" | "md" | "lg" }) => {
    const dimensions = {
      sm: "w-10 h-10",
      md: "w-12 h-12",
      lg: "w-24 h-24"
    };
    
    return (
      <div className={clsx(dimensions[size], "relative rounded-md overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0")}>
        {src ? (
          <Image src={src} alt={alt || 'Profile'} fill className="object-cover" />
        ) : (
          <UserIcon className={clsx("text-neutral-500", size === 'lg' ? 'w-12 h-12' : 'w-6 h-6')} />
        )}
      </div>
    );
  };

  const getStatus = (node: any) => {
    // Mocking status text from the image, ideally this comes from DB
    return "Remote In";
  };

  return (
    <div className="w-full sm:max-w-sm lg:max-w-none mx-auto space-y-4 font-sans relative">
      
      {/* Background decoration to match the leaves pattern in screenshot (optional) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-emerald-900 to-teal-900 rounded-t-xl -z-10 opacity-30"></div>

      {/* 1. Main Profile Card */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6 pt-14 relative flex flex-col items-center mt-12">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-1 bg-neutral-900 rounded-xl">
          <Avatar src={currentUser?.profileImage} size="lg" />
        </div>
        
        <h3 className="text-white font-semibold text-sm">
          {currentUser?.employeeId} - {currentUser?.name?.toUpperCase()}
        </h3>
        <p className="text-neutral-400 text-sm mt-1">{currentUser?.designation || 'Employee'}</p>
        
        <p className="text-emerald-500 text-sm font-medium mt-3">
          {todayAttendance?.status === 'present' || todayAttendance?.status === 'late' ? 'Remote In' : 'Not Checked In'}
        </p>
        
        <div className="flex gap-2 items-center justify-center mt-3 mb-2">
          {elapsed.split(' : ').map((part, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <span className="bg-neutral-800 text-white px-3 py-1.5 rounded text-lg font-medium">{part}</span>
              {i < arr.length - 1 && <span className="text-neutral-500 font-bold">:</span>}
            </div>
          ))}
        </div>
        
        <div className="h-4 mb-2">
          {message && (
            <p className={`text-xs w-full text-center ${message.includes('failed') || message.includes('error') || message.includes('Already') || message.includes('Not') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </p>
          )}
        </div>
        
        {!todayAttendance?.loginTime ? (
          <button 
            disabled={isActionLoading}
            className="w-full border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 py-2 rounded-md font-medium transition-colors text-sm flex items-center justify-center disabled:opacity-50"
            onClick={() => handleAttendanceAction('check-in')}
          >
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-in'}
          </button>
        ) : !todayAttendance?.logoutTime ? (
          <button 
            disabled={isActionLoading}
            className="w-full border border-red-500/50 text-red-400 hover:bg-red-500/10 py-2 rounded-md font-medium transition-colors text-sm flex items-center justify-center disabled:opacity-50"
            onClick={() => handleAttendanceAction('check-out')}
          >
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-out'}
          </button>
        ) : (
          <button 
            disabled
            className="w-full border border-neutral-700 text-neutral-500 bg-neutral-800 py-2 rounded-md font-medium text-sm flex items-center justify-center"
          >
            Completed
          </button>
        )}
      </div>

      {/* 2. Reporting Manager Card */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4">
        <h4 className="text-white font-semibold text-sm mb-3">Reporting Manager</h4>
        {manager ? (
          <div className="flex items-center gap-3">
            <Avatar src={manager.profileImage} />
            <div>
              <p className="text-white text-sm font-medium">
                {manager.employeeId} - {manager.name}
              </p>
              <p className="text-emerald-500 text-xs font-medium mt-0.5">{getStatus(manager)}</p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm italic">Directly reports to Admin / No Manager</p>
        )}
      </div>

      {/* 3. Department Members / Subordinates Card */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4">
        <h4 className="text-white font-semibold text-sm mb-3">
          Reporting to Me
        </h4>
        <div className="space-y-4">
          {subordinates && subordinates.length > 0 ? (
            subordinates.map((sub: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <Avatar src={sub.profileImage} />
                <div>
                  <p className="text-white text-sm font-medium">
                    {sub.employeeId} - {sub.name}
                  </p>
                  <p className="text-emerald-500 text-xs font-medium mt-0.5">{getStatus(sub)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm italic">No employees reporting to you.</p>
          )}
        </div>
      </div>

    </div>
  );
}
