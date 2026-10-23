import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import {
  formatMedicalCertificateFilename,
  getFileExtension,
  isValidMedicalCertificateType,
  uploadFileToWorkDrive,
} from '@/lib/zohoWorkdrive';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const leaves = await Leave.find({ userId: session.user.id }, null, { bypassTenant: true })
      .sort({ createdAt: -1 })
      .lean();

    const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
    const balance = await LeaveBalanceEngine.syncLeaveBalance(session.user.id);

    return NextResponse.json({ leaves, balance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id, null, { bypassTenant: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let leaveType = '';
    let fromDate = '';
    let toDate = '';
    let reason = '';
    const finalAttachments: string[] = [];
    const filesToUpload: { buffer: Buffer; originalName: string; mimeType: string }[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      leaveType = (formData.get('leaveType') as string) || '';
      fromDate = (formData.get('fromDate') as string) || '';
      toDate = (formData.get('toDate') as string) || '';
      reason = (formData.get('reason') as string) || '';

      const fileEntries = formData.getAll('files');
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          const buffer = Buffer.from(await entry.arrayBuffer());
          filesToUpload.push({
            buffer,
            originalName: entry.name,
            mimeType: entry.type || 'application/pdf',
          });
        }
      }
    } else {
      const body = await req.json();
      leaveType = body.leaveType || '';
      fromDate = body.fromDate || '';
      toDate = body.toDate || '';
      reason = body.reason || '';

      const incomingAttachments = Array.isArray(body.attachments) ? body.attachments : [];
      for (const att of incomingAttachments) {
        if (typeof att === 'string') {
          if (att.startsWith('data:')) {
            const matches = att.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
            const mimeType = matches ? matches[1] : 'application/pdf';
            const base64Data = matches ? matches[2] : att;
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = mimeType.split('/')[1] || 'pdf';
            filesToUpload.push({
              buffer,
              originalName: `medical_certificate.${ext}`,
              mimeType,
            });
          } else if (att.startsWith('http://') || att.startsWith('https://')) {
            finalAttachments.push(att);
          }
        }
      }
    }

    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
    const eligibility = await LeaveBalanceEngine.checkEligibility(session.user.id, leaveType, numberOfDays);

    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    // Process file uploads to Zoho WorkDrive
    if (filesToUpload.length > 0) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileItem = filesToUpload[i];

        if (!isValidMedicalCertificateType(fileItem.originalName, fileItem.mimeType)) {
          return NextResponse.json(
            { error: `Invalid file format for "${fileItem.originalName}". Only PDF, PNG, JPG, and JPEG files are allowed.` },
            { status: 400 }
          );
        }

        const ext = getFileExtension(fileItem.originalName, fileItem.mimeType);
        const renamedFilename = leaveType === 'Sick Leave'
          ? formatMedicalCertificateFilename({
              employeeName: user.name,
              leaveDate: fromDate,
              extension: ext,
              index: i,
            })
          : `${user.name}_LeaveDoc_${i > 0 ? `${i + 1}_` : ''}${fromDate}.${ext}`;

        try {
          const uploadResult = await uploadFileToWorkDrive({
            content: fileItem.buffer,
            filename: renamedFilename,
            contentType: fileItem.mimeType,
          });
          finalAttachments.push(uploadResult.directUrl);
        } catch (uploadError: any) {
          console.error('WorkDrive upload error:', uploadError.response?.data || uploadError.message);
          return NextResponse.json(
            { error: `Failed to upload medical certificate to Zoho WorkDrive: ${uploadError.message}` },
            { status: 500 }
          );
        }
      }
    }

    if (eligibility.requiresDocument && (!finalAttachments || finalAttachments.length === 0)) {
      return NextResponse.json({ error: 'Supporting documents are required for this leave type.' }, { status: 400 });
    }

    let currentApprover = user?.reportsTo;

    if (!currentApprover) {
      const admin = await User.findOne({ role: 'admin' }, null, { bypassTenant: true });
      if (admin) currentApprover = admin._id;
    }

    const leave = await Leave.create({
      userId: session.user.id,
      leaveType,
      fromDate,
      toDate,
      numberOfDays,
      reason,
      attachments: finalAttachments,
      status: 'pending',
      currentApprover: undefined,
    });

    const Notification = (await import('@/models/Notification')).default;
    if (currentApprover) {
      await Notification.create({
        recipientId: currentApprover,
        type: 'LEAVE_APPLIED',
        message: `${user?.name || 'An employee'} applied for ${leaveType} leave.`,
        link: '/employee/approvals',
      });
    } else {
      await Notification.create({
        targetRole: 'admin',
        type: 'LEAVE_APPLIED',
        message: `${user?.name || 'An employee'} applied for ${leaveType} leave.`,
        link: '/admin/leaves',
      });
    }

    return NextResponse.json({ message: 'Leave application submitted', leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
