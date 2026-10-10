// Firebase Messaging Service Worker v1.0.3
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Ensure new versions activate immediately without waiting for browser restart
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

const firebaseConfig = {
  apiKey: "AIzaSyCbTUYmWhYGU4sBp69L2KhC2h7nR8sF4Gw",
  authDomain: "attendance-app-b0bce.firebaseapp.com",
  projectId: "attendance-app-b0bce",
  storageBucket: "attendance-app-b0bce.firebasestorage.app",
  messagingSenderId: "172747987411",
  appId: "1:172747987411:web:77a1f73f4a9b7a6f89b726"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // If the push message already has a notification payload, Firebase Cloud Messaging
  // automatically displays it in the system tray. Never call showNotification() here
  // to prevent duplicate popups.
  if (payload.notification) {
    return;
  }

  // Only display manually if this is a data-only message (no payload.notification)
  const notificationTitle = payload.data?.title || 'TruFlow Attendance';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: '/TF.png',
    badge: '/TF.png',
    tag: payload.data?.tag || payload.data?.type || 'attendance-notification',
    renotify: false,
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event.notification);
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
