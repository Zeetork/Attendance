'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function UserStatusWatcher() {
  const { data: session, status } = useSession();
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    // Only monitor when a user is actively authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const triggerLogout = async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      toast.error('Your account has been deactivated. Logging out...', {
        id: 'account-deactivated',
        duration: 4000,
      });

      try {
        localStorage.removeItem('activeCompanyId');
        await signOut({ redirect: false });
      } catch (err) {
        console.error('[UserStatusWatcher] Error signing out:', err);
      }

      window.location.href = '/login?error=inactive';
    };

    const checkActiveStatus = async () => {
      if (isLoggingOutRef.current) return;

      try {
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (response.status === 403 || response.status === 401) {
          const data = await response.json().catch(() => ({}));
          if (data.reason === 'inactive' || data.active === false || response.status === 401) {
            await triggerLogout();
          }
        } else if (response.ok) {
          const data = await response.json();
          if (data.active === false) {
            await triggerLogout();
          }
        }
      } catch {
        // Transient network glitch - skip and retry on next interval
      }
    };

    // Initial check on mount
    checkActiveStatus();

    // Check every 3.5 seconds
    const intervalId = setInterval(checkActiveStatus, 3500);

    // Immediate check on tab focus or visibility change
    const handleFocus = () => {
      checkActiveStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActiveStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, session?.user]);

  return null;
}
