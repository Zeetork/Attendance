import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { toast } from 'react-hot-toast';

let isListening = false;

/**
 * Request notification permission from the browser, retrieve the FCM token,
 * and register it with the backend server.
 */
export const requestWebPushPermission = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('This browser does not support desktop notifications or service workers.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Web push permission was not granted (status:', permission, ')');
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) {
      console.warn('Firebase Messaging is not supported in this browser.');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(msg, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      // Register token with our backend
      try {
        await fetch('/api/notifications/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: 'web' }),
        });
      } catch (regErr) {
        console.error('Failed to register token with backend:', regErr);
      }

      // Initialize foreground message listener
      setupForegroundMessageListener(msg);

      return token;
    } else {
      console.warn('No FCM registration token available.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving web push token:', error);
    return null;
  }
};

/**
 * Setup listener for messages received when the application tab is active/foreground.
 */
export const setupForegroundMessageListener = (messagingInstance?: Messaging | null) => {
  if (typeof window === 'undefined' || isListening) return;

  const listen = async () => {
    try {
      const msg = messagingInstance || (await getFirebaseMessaging());
      if (!msg) return;

      onMessage(msg, (payload) => {
        console.log('[Foreground FCM Message Received]:', payload);

        const title = payload.notification?.title || payload.data?.title || 'Attendance Notification';
        const body = payload.notification?.body || payload.data?.body || '';

        // 1. Show toast inside the application
        toast(`${title}${body ? `: ${body}` : ''}`, {
          icon: '🔔',
          duration: 6000,
        });

        // 2. If the user is on another application/tab, show native OS notification as well
        if (document.hidden && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/TF.png',
              badge: '/TF.png',
            });
          } catch (e) {
            // Some mobile browsers restrict new Notification in document context
          }
        }

        // 3. Dispatch an event for reactive components (like Notification bell) to update
        window.dispatchEvent(new CustomEvent('fcm-message-received', { detail: payload }));
      });

      isListening = true;
    } catch (err) {
      console.error('Error setting up foreground FCM message listener:', err);
    }
  };

  listen();
};

/**
 * If permission is already granted, silently ensure the token is registered
 * and foreground listener is attached.
 */
export const autoRegisterPushToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  if (Notification.permission === 'granted') {
    return requestWebPushPermission();
  }
  return null;
};
