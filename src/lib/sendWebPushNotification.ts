import { initFirebaseAdmin } from './firebaseAdmin';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import dbConnect from './mongodb';
import PushToken from '@/models/PushToken';
import mongoose from 'mongoose';

export const sendWebPushNotification = async (
  userId: string,
  notification: { title: string; body: string; data?: { [key: string]: string } }
) => {
  const app = initFirebaseAdmin();
  const messaging = getMessaging(app);

  await dbConnect();

  // 1. Find all PushToken records for the given user (supporting both ObjectId & string)
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
  const query = userObjId ? { $or: [{ userId }, { userId: userObjId }] } : { userId };
  const tokens = await PushToken.find(query, null, { bypassTenant: true }).lean();

  if (!tokens || tokens.length === 0) {
    return { found: 0, sent: 0, failed: 0 };
  }

  const tokenStrings = tokens.map((t) => t.token);
  const clickUrl = notification.data?.url || (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  // 2. Build the message with notification, webpush config, and data payload
  const message: MulticastMessage = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    webpush: {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/TF.png',
        badge: '/TF.png',
      },
      fcmOptions: {
        link: clickUrl,
      },
    },
    tokens: tokenStrings,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    // 3. Handle individual token failures & cleanup stale tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokenStrings[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await PushToken.deleteMany({ token: { $in: failedTokens } }, { bypassTenant: true } as any);
      }
    }

    return {
      found: tokenStrings.length,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending multicast push message:', error);
    throw error;
  }
};

export const sendWebPushToAll = async (
  notification: { title: string; body: string; data?: { [key: string]: string } }
) => {
  const app = initFirebaseAdmin();
  const messaging = getMessaging(app);

  await dbConnect();

  const tokens = await PushToken.find({}, null, { bypassTenant: true }).lean();
  if (!tokens || tokens.length === 0) {
    return { found: 0, sent: 0, failed: 0 };
  }

  const tokenStrings = Array.from(new Set(tokens.map((t) => t.token)));
  const clickUrl = notification.data?.url || (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  let totalSent = 0;
  let totalFailed = 0;
  const staleTokens: string[] = [];

  // Firebase allows up to 500 tokens per multicast batch
  const batchSize = 500;
  for (let i = 0; i < tokenStrings.length; i += batchSize) {
    const batch = tokenStrings.slice(i, i + batchSize);
    const message: MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/TF.png',
          badge: '/TF.png',
        },
        fcmOptions: {
          link: clickUrl,
        },
      },
      tokens: batch,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      totalSent += response.successCount;
      totalFailed += response.failureCount;

      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              staleTokens.push(batch[idx]);
            }
          }
        });
      }
    } catch (batchErr) {
      console.error('Error sending batch multicast message:', batchErr);
    }
  }

  if (staleTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: staleTokens } });
  }

  return {
    found: tokenStrings.length,
    sent: totalSent,
    failed: totalFailed,
  };
};
