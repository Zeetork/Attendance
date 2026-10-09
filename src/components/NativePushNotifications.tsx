'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  RegistrationError,
  PushNotificationSchema,
  ActionPerformed,
  PermissionStatus,
} from '@capacitor/push-notifications';
import { toast } from 'react-hot-toast';

const DENIED_STORAGE_KEY = 'native_push_permission_denied';

/**
 * NativePushNotifications:
 * - Runs exclusively on native Android via Capacitor.
 * - Manages runtime notification permission handling (Android 13+ POST_NOTIFICATIONS).
 * - Avoids repeatedly prompting users who have denied permissions.
 * - Sets up FCM listeners (registration, error, received, action) before invoking register().
 * - Associates captured native FCM tokens with the authenticated employee via /api/notifications/register.
 * - Safely manages and cleans up plugin listeners to prevent duplicates during navigation or StrictMode remounts.
 */
export default function NativePushNotifications() {
  const { data: session, status } = useSession();
  const sessionRef = useRef(session);
  const statusRef = useRef(status);

  useEffect(() => {
    sessionRef.current = session;
    statusRef.current = status;
  }, [session, status]);

  const fcmTokenRef = useRef<string | null>(null);
  const registeredKeyRef = useRef<string | null>(null);
  const listenerHandlesRef = useRef<PluginListenerHandle[]>([]);
  const isSetupDoneRef = useRef(false);

  // Securely sync the native FCM token to the existing Next.js backend
  const registerTokenWithBackend = useCallback(async (tokenValue: string, userId: string) => {
    const registrationKey = `${userId}:${tokenValue}`;
    if (registeredKeyRef.current === registrationKey) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenValue,
          platform: 'android',
        }),
      });

      if (response.ok) {
        registeredKeyRef.current = registrationKey;
        console.log('[NativePush] Successfully registered device FCM token with backend.');
      } else {
        console.warn('[NativePush] Backend rejected token registration:', response.status, response.statusText);
      }
    } catch (networkError) {
      console.error('[NativePush] Network error registering token with backend:', networkError);
    }
  }, []);

  // Sync token to backend whenever an authenticated session becomes available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && fcmTokenRef.current) {
      void registerTokenWithBackend(fcmTokenRef.current, session.user.id);
    }
  }, [status, session?.user?.id, registerTokenWithBackend]);

  useEffect(() => {
    // 1. Platform checks: ensure we are on native Android and the plugin is available
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      console.warn('[NativePush] PushNotifications plugin is not available on this platform.');
      return;
    }

    if (isSetupDoneRef.current) {
      return;
    }

    isSetupDoneRef.current = true;
    let isCancelled = false;

    const setupNativePush = async () => {
      try {
        // 2. Permission check
        let permission: PermissionStatus;
        try {
          permission = await PushNotifications.checkPermissions();
        } catch (checkErr) {
          console.warn('[NativePush] Notification permissions unavailable on this device:', checkErr);
          return;
        }

        // Handle already denied state without prompting
        if (permission.receive === 'denied') {
          console.log('[NativePush] Push notification permission is denied in system settings.');
          return;
        }

        // Avoid re-prompting if the user already dismissed/denied previously
        const deniedInStorage =
          typeof window !== 'undefined' && localStorage.getItem(DENIED_STORAGE_KEY) === 'true';
        if (deniedInStorage) {
          console.log('[NativePush] Push permission prompt previously dismissed; skipping prompt.');
          return;
        }

        // 3. Request permission if currently in 'prompt' or 'prompt-with-rationale' state
        if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
          try {
            permission = await PushNotifications.requestPermissions();
          } catch (reqErr) {
            console.error('[NativePush] Failed to request notification permissions:', reqErr);
            return;
          }

          if (permission.receive === 'denied') {
            if (typeof window !== 'undefined') {
              localStorage.setItem(DENIED_STORAGE_KEY, 'true');
            }
            console.log('[NativePush] User denied notification permission.');
            return;
          }
        }

        if (permission.receive !== 'granted') {
          console.log('[NativePush] Notification permission not granted (state: ' + permission.receive + ')');
          return;
        }

        if (isCancelled) return;

        // 4. Create an Android high-importance notification channel for reminders
        try {
          await PushNotifications.createChannel({
            id: 'attendance-reminders',
            name: 'Attendance Reminders',
            description: 'Notifications for check-in and check-out reminders',
            importance: 4, // High importance
            visibility: 1, // Public on lockscreen
            lights: true,
            vibration: true,
          });
        } catch (channelErr) {
          console.warn('[NativePush] Non-critical: Could not create notification channel:', channelErr);
        }

        if (isCancelled) return;

        // Clean up any previously attached listener handles
        for (const handle of listenerHandlesRef.current) {
          try {
            await handle.remove();
          } catch {
            // ignore
          }
        }
        listenerHandlesRef.current = [];

        // 5. Register all required listeners BEFORE calling PushNotifications.register()
        const registrationHandle = await PushNotifications.addListener(
          'registration',
          (token: Token) => {
            console.log('[NativePush] Native FCM registration token received:', token.value);
            fcmTokenRef.current = token.value;

            if (statusRef.current === 'authenticated' && sessionRef.current?.user?.id) {
              void registerTokenWithBackend(token.value, sessionRef.current.user.id);
            }
          }
        );
        listenerHandlesRef.current.push(registrationHandle);

        const regErrorHandle = await PushNotifications.addListener(
          'registrationError',
          (error: RegistrationError) => {
            console.error('[NativePush] Push registration error:', error.error);
          }
        );
        listenerHandlesRef.current.push(regErrorHandle);

        const receivedHandle = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('[NativePush] Foreground notification received:', notification);

            const title = notification.title || 'Attendance Notification';
            const body = notification.body || '';

            // Display in-app toast for foreground notification
            toast(`${title}${body ? `: ${body}` : ''}`, {
              icon: '🔔',
              duration: 5000,
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('native-push-received', { detail: notification })
              );
            }
          }
        );
        listenerHandlesRef.current.push(receivedHandle);

        const actionHandle = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('[NativePush] Notification tapped (action performed):', action);

            // Navigate to target URL if specified in payload
            const targetUrl = action.notification.data?.url;
            if (targetUrl && typeof window !== 'undefined') {
              window.location.href = targetUrl;
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('native-push-action-performed', { detail: action })
              );
            }
          }
        );
        listenerHandlesRef.current.push(actionHandle);

        if (isCancelled) return;

        // 6. Request registration with FCM
        await PushNotifications.register();
      } catch (generalErr) {
        console.error('[NativePush] Unexpected error during push setup:', generalErr);
      }
    };

    void setupNativePush();

    return () => {
      isCancelled = true;
      isSetupDoneRef.current = false;
      for (const handle of listenerHandlesRef.current) {
        try {
          void handle.remove();
        } catch {
          // ignore
        }
      }
      listenerHandlesRef.current = [];
    };
  }, [registerTokenWithBackend]);

  return null;
}