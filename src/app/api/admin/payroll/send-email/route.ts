import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import User from '@/models/User';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { format } from 'date-fns';
import { sendEmail } from '@/lib/emailService';
import { generatePayslipHtml } from '@/lib/payslipTemplate';
import Company from '@/models/Company';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let browser;

  try {
    // ================= AUTH =================
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payrollId } = await req.json();

    if (!payrollId) {
      return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
    }

    await dbConnect();

    const payroll = await Payroll.findById(payrollId).populate({
      path: 'userId',
      model: User,
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    const user = payroll.userId as any;
    const monthName = format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy');

    const company = await Company.findById(payroll.companyId) || null;

    // ================= HTML =================
    const htmlContent = generatePayslipHtml(payroll, user, company);

    // ================= PUPPETEER =================
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL_ENV;
    
    browser = await puppeteer.launch({
      executablePath: isLocal 
        ? await chromium.executablePath() 
        : await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'),

      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],

      headless: true,

      defaultViewport: {
        width: 1280,
        height: 1600,
      },
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'load',
    });

    await page.emulateMediaType('screen');

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    // ================= VALIDATION =================
    if (!pdfBuffer || pdfBuffer.length < 1000) {
      throw new Error('PDF generation failed (empty or corrupted buffer)');
    }

    const fileName = `Payslip_${user.employeeId}_${monthName}.pdf`;

    // ================= EMAIL =================
    await sendEmail({
      to: user.email,
      subject: `Your Payslip for ${monthName}`,
      html: `
        <p>Dear ${user.name},</p>
        <p>Please find attached your payslip for ${monthName}.</p>
        <p>Regards,<br>HR Team</p>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Payslip sent successfully',
      data: null,
    });

  } catch (err: any) {
    console.error('Email/PDF Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}