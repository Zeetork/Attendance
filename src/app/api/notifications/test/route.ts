import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendWebPushNotification, sendWebPushToAll } from '@/lib/sendWebPushNotification';
import dbConnect from '@/lib/mongodb';
import PushToken from '@/models/PushToken';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const userTokens = await PushToken.find(
      {
        $or: [{ userId: session.user.id }, { userId }],
      },
      null,
      { bypassTenant: true }
    ).lean();

    const isPrivileged = ['admin', 'super_admin', 'company_admin'].includes((session.user as any).role);
    const totalTokens = isPrivileged
      ? await PushToken.countDocuments({}, { bypassTenant: true } as any)
      : userTokens.length;

    return NextResponse.json(
      {
        success: true,
        userTokensCount: userTokens.length,
        totalTokensCount: totalTokens,
        userTokens: userTokens.map((t) => ({ platform: t.platform, createdAt: t.createdAt })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const title = payload.title?.trim() || 'TruFlow Attendance';
    const message = payload.body?.trim() || 'This is a test push notification.';
    const target = payload.target || 'me';

    await dbConnect();

    let result;
    const isPrivileged = ['admin', 'super_admin', 'company_admin'].includes((session.user as any).role);

    if (target === 'all' && isPrivileged) {
      result = await sendWebPushToAll({
        title,
        body: message,
        data: { url: '/employee/dashboard', type: 'test' },
      });
    } else {
      result = await sendWebPushNotification(session.user.id, {
        title,
        body: message,
        data: { url: '/employee/dashboard', type: 'test' },
      });
    }

    // Save in-app notification record so it appears under the bell icon
    try {
      await Notification.create({
        companyId: (session.user as any).companyId
          ? new mongoose.Types.ObjectId((session.user as any).companyId)
          : undefined,
        recipientId: new mongoose.Types.ObjectId(session.user.id),
        type: 'test_notification',
        message: `${title}: ${message}`,
        isRead: false,
        link: '/employee/dashboard',
      });
    } catch (notifErr) {
      console.warn('Failed to insert in-app notification entry:', notifErr);
    }

    if (result.found === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No web push tokens found for this user. Please click "Enable Notifications" first.',
          result,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Test notification sent successfully to ${result.sent} device(s).`,
        result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error testing push notification:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
