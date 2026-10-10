import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PushToken from '@/models/PushToken';
import { auth } from '@/auth';
import { initFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getMessaging } from 'firebase-admin/messaging';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, platform, deviceId } = await req.json();

    if (!token || !platform) {
      return NextResponse.json({ error: 'Token and platform are required' }, { status: 400 });
    }

    if (!['web', 'android', 'ios'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    await dbConnect();

    const user = session.user as { id: string; companyId?: string };
    const userId = new mongoose.Types.ObjectId(user.id);
    const companyId = user.companyId
      ? new mongoose.Types.ObjectId(user.companyId)
      : undefined;

    // Deduplicate: Clean up older/stale tokens for this user on the same platform/device
    if (deviceId) {
      await PushToken.deleteMany({
        $or: [
          { userId, deviceId, token: { $ne: token } },
          { token, userId: { $ne: userId } },
        ],
      });
    } else {
      // If no deviceId, prune older tokens for this user on this platform so only the latest active one remains
      await PushToken.deleteMany({
        userId,
        platform,
        token: { $ne: token },
      });
    }

    // Upsert the current active token
    await PushToken.findOneAndUpdate(
      { token },
      {
        userId,
        companyId,
        platform,
        ...(deviceId ? { deviceId } : {}),
      },
      { upsert: true, new: true }
    );

    // Subscribe to standard notification topics in Firebase Admin
    try {
      const app = initFirebaseAdmin();
      const messaging = getMessaging(app);
      await messaging.subscribeToTopic([token], 'all');
      await messaging.subscribeToTopic([token], 'attendance-reminders');
    } catch (topicErr) {
      console.warn('Non-critical: Failed to subscribe token to FCM topic:', topicErr);
    }

    return NextResponse.json({ success: true, message: 'Token registered successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error registering push token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
