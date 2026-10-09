'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import {
  autoRegisterPushToken,
  requestWebPushPermission,
  setupForegroundMessageListener,
} from '@/lib/webPushNotifications';

/**
 * WebPushInitializer:
 * 1. Checks if browser notifications are enabled for the current user.
 * 2. If already granted: silently registers/refreshes the FCM token and listens for foreground push alerts.
 * 3. If turned off / not granted ('default'): displays an elegant, non-intrusive prompt asking the user
 *    to turn on browser notifications so they receive check-in and check-out reminders.
 * 4. If blocked ('denied'): optionally shows a helpful tip on how to enable them in the browser settings.
 */
export default function WebPushInitializer() {
  const { data: session, status } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default';
    if (
      Capacitor.isNativePlatform() ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      return 'unsupported';
    }
    return Notification.permission;
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || permission === 'unsupported') return;

    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
      // 1. User has already enabled notifications -> auto-sync token and attach listener
      setupForegroundMessageListener();
      autoRegisterPushToken().catch((err) => {
        console.warn('Auto web push registration notice:', err);
      });
    } else if (currentPermission === 'default') {
      // 2. Notifications are turned off / not yet prompted -> check if dismissed in current session
      const isDismissed = sessionStorage.getItem('hrms_push_prompt_dismissed');
      if (!isDismissed) {
        // Small delay so page loads smoothly before showing prompt
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else if (currentPermission === 'denied') {
      // 3. Blocked by browser settings - keep prompt hidden
    }
  }, [session, status, permission]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const token = await requestWebPushPermission();
      if (token) {
        setPermission('granted');
        setIsVisible(false);
        toast.success('Push notifications enabled! You will now receive check-in & check-out reminders.', {
          icon: '🔔',
          duration: 5000,
        });
      } else {
        const updatedPerm = Notification.permission;
        setPermission(updatedPerm);
        if (updatedPerm === 'denied') {
          toast.error('Notifications were blocked. Please enable them in your browser settings.');
          setIsVisible(false);
        } else {
          toast('Notification permission was dismissed.', { icon: 'ℹ️' });
        }
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      toast.error('Failed to enable notifications.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hrms_push_prompt_dismissed', 'true');
  };

  if (!isVisible || permission === 'granted' || permission === 'unsupported') {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card text-card-foreground border border-border/80 shadow-2xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 backdrop-blur-md bg-card/95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-amber-500/10 text-amber-500 rounded-xl flex-shrink-0">
              <Bell className="h-5 w-5 animate-bounce" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground leading-tight">
                Turn On Notifications
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Never miss your daily check-in and check-out attendance reminders.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification prompt"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
          <button
            onClick={handleDismiss}
            disabled={isRequesting}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>{isRequesting ? 'Enabling...' : 'Turn On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
