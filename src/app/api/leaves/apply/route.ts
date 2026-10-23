import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User';
import Notification from '@/models/Notification';
import {
  formatMedicalCertificateFilename,
  getFileExtension,
  isValidMedicalCertificateType,
  uploadFileToWorkDrive,
} from '@/lib/zohoWorkdrive';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id, null, { bypassTenant: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let leaveType = '';
    let fromDate = '';
    let toDate = '';
    let reason = '';
    let duration = 'full_day';
    let halfDaySession: string | null = null;
    const finalAttachments: string[] = [];
    const filesToUpload: { buffer: Buffer; originalName: string; mimeType: string }[] = [];

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      leaveType = (formData.get('leaveType') as string) || '';
      fromDate = (formData.get('fromDate') as string) || '';
      toDate = (formData.get('toDate') as string) || '';
      reason = (formData.get('reason') as string) || '';
      duration = (formData.get('duration') as string) || 'full_day';
      const rawHalfDay = (formData.get('halfDaySession') as string) || '';
      halfDaySession = rawHalfDay === '' ? null : rawHalfDay;

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
      duration = body.duration || 'full_day';
      halfDaySession = (body.halfDaySession === '' || !body.halfDaySession) ? null : body.halfDaySession;

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

    const finalHalfDaySession = (halfDaySession === '' || !halfDaySession) ? null : halfDaySession;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json({ error: 'Missing required leave fields' }, { status: 400 });
    }

    // Calculate number of days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    if (duration === 'half_day') {
      if (numberOfDays !== 1) {
        return NextResponse.json({ error: 'Half day leave must be for a single date' }, { status: 400 });
      }
      if (!finalHalfDaySession) {
        return NextResponse.json({ error: 'Session (First Half / Second Half) is required for half day leave' }, { status: 400 });
      }
      numberOfDays = 0.5;
    }

    // 1. Check Leave Policy allowHalfDay flag
    if (duration === 'half_day') {
      const LeavePolicy = (await import('@/models/LeavePolicy')).default;
      const policy = await LeavePolicy.findOne({
        $or: [
          { leaveType: leaveType, companyId: user.companyId },
          { name: leaveType, companyId: user.companyId },
          { leaveType: leaveType },
          { name: leaveType }
        ]
      });

      if (policy && policy.allowHalfDay === false) {
        return NextResponse.json({ error: `Half-day leaves are not permitted for ${leaveType}.` }, { status: 400 });
      }
    }

    // 2. Check Holiday or Rest Day
    const Holiday = (await import('@/models/Holiday')).default;
    const isHoliday = await Holiday.exists({
      date: { $gte: start, $lte: end },
      holidayType: { $in: ['public', 'company'] }
    });
    if (isHoliday) {
      return NextResponse.json({ error: 'Cannot apply for leave on a Public or Company Holiday.' }, { status: 400 });
    }

    // 3. Check for overlapping leaves
    const overlappingLeaves = await Leave.find({
      userId: session.user.id,
      status: { $in: ['pending', 'approved'] },
      fromDate: { $lte: end },
      toDate: { $gte: start }
    });

    if (overlappingLeaves.length > 0) {
      if (duration === 'half_day') {
        for (const ol of overlappingLeaves) {
          if (ol.duration !== 'half_day') {
            return NextResponse.json({ error: 'You already have a full day leave during this period.' }, { status: 400 });
          }
          if (ol.halfDaySession === finalHalfDaySession) {
            return NextResponse.json({
              error: `You already have a leave request for the ${finalHalfDaySession === 'first_half' ? 'First Half' : 'Second Half'} on this date.`
            }, { status: 400 });
          }
        }
      } else {
        return NextResponse.json({ error: 'You already have a pending or approved leave during this period.' }, { status: 400 });
      }
    }

    const { LeaveBalanceEngine } = await import('@/services/LeaveBalanceEngine');
    const eligibility = await LeaveBalanceEngine.checkEligibility(session.user.id, leaveType, numberOfDays);

    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    if (leaveType === 'Restricted Holiday' || leaveType === 'Restricted Leave') {
      const days = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      for (const day of days) {
        const utcStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0));
        const utcEnd = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999));

        const isRH = await Holiday.exists({
          date: { 
            $gte: new Date(utcStart.getTime() - 14 * 3600 * 1000), 
            $lte: new Date(utcEnd.getTime() + 14 * 3600 * 1000) 
          },
          holidayType: 'restricted'
        });
        if (!isRH) {
          const dateStr = day.toISOString().split('T')[0];
          return NextResponse.json({ error: `You can only apply for Restricted Holiday on designated restricted holidays. ${dateStr} is not a Restricted Holiday.` }, { status: 400 });
        }
      }
    }

    // Process file uploads to Zoho WorkDrive
    if (filesToUpload.length > 0) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileItem = filesToUpload[i];

        // 1. Validate file extension and MIME type (acceptable: pdf, png, jpg, jpeg)
        if (!isValidMedicalCertificateType(fileItem.originalName, fileItem.mimeType)) {
          return NextResponse.json(
            { error: `Invalid file format for "${fileItem.originalName}". Only PDF, PNG, JPG, and JPEG files are allowed.` },
            { status: 400 }
          );
        }

        // 2. Generate renamed filename according to user specification:
        // "employeeName" + "_ " + "MC " + "_ " + "date ( dd/mm/yyyy )" (for example => Employee A_MC_20/10/2026.pdf)
        const ext = getFileExtension(fileItem.originalName, fileItem.mimeType);
        const renamedFilename = leaveType === 'Sick Leave'
          ? formatMedicalCertificateFilename({
              employeeName: user.name,
              leaveDate: fromDate,
              extension: ext,
              index: i,
            })
          : `${user.name}_LeaveDoc_${i > 0 ? `${i + 1}_` : ''}${fromDate}.${ext}`;

        // 3. Upload to Zoho WorkDrive
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
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfDays,
      duration: duration as any,
      halfDaySession: finalHalfDaySession as any,
      attachments: finalAttachments,
      reason,
      status: 'pending',
      currentApprover: currentApprover || undefined,
    });

    if (currentApprover) {
      let leaveDesc = 'leave';
      if (duration === 'half_day') {
        leaveDesc = finalHalfDaySession === 'first_half' ? 'First Half Leave' : 'Second Half Leave';
      }

      await Notification.create({
        recipientId: currentApprover,
        type: 'LEAVE_REQUEST',
        message: `${user?.name} has applied for ${leaveDesc} and requires your approval.`,
        link: user?.role === 'employee' ? '/employee/leaves' : '/admin/leaves',
      });
    }

    return NextResponse.json({ message: 'Leave applied successfully', leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
