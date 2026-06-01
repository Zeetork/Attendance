import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import User from '@/models/User';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let browser;

  try {
    // ================= AUTH =================
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
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

    // ================= HTML =================
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payslip - ${monthName}</title>

  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #f4f6f9;
      padding: 30px;
      color: #1f2937;
    }

    .container {
      max-width: 800px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }

    .header .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .header .title {
      margin-top: 8px;
      font-size: 16px;
      opacity: 0.9;
    }

    /* BODY */
    .content {
      padding: 25px 30px;
    }

    .section {
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .section-header {
      background: #f9fafb;
      padding: 12px 15px;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .item {
      padding: 12px 15px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }

    .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 3px;
    }

    .value {
      font-weight: 600;
    }

    /* SALARY TABLE */
    .salary-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .card {
      border-radius: 10px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      background: #fff;
    }

    .earnings {
      border-left: 4px solid #22c55e;
    }

    .deductions {
      border-left: 4px solid #ef4444;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
    }

    .row span:first-child {
      color: #6b7280;
    }

    .row span:last-child {
      font-weight: 600;
    }

    /* NET PAY */
    .net-pay {
      margin-top: 20px;
      padding: 18px;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border-left: 5px solid #22c55e;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .net-pay span {
      color: #065f46;
    }

    /* FOOTER */
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      padding: 20px;
      border-top: 1px solid #eee;
      margin-top: 20px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>

<body>

<div class="container">

  <!-- HEADER -->
  <div class="header">
    <div class="logo">HRMS System</div>
    <div class="title">Payslip for ${monthName}</div>
  </div>

  <div class="content">

    <!-- EMPLOYEE INFO -->
    <div class="section">
      <div class="section-header">Employee Information</div>
      <div class="grid">

        <div class="item">
          <div class="label">Name</div>
          <div class="value">${user.name}</div>
        </div>

        <div class="item">
          <div class="label">Employee ID</div>
          <div class="value">${user.employeeId}</div>
        </div>

        <div class="item">
          <div class="label">Department</div>
          <div class="value">${user.department}</div>
        </div>

        <div class="item">
          <div class="label">Designation</div>
          <div class="value">${user.designation}</div>
        </div>

        <div class="item">
          <div class="label">Working Days</div>
          <div class="value">${payroll.totalWorkingDays}</div>
        </div>

        <div class="item">
          <div class="label">Present Days</div>
          <div class="value">${payroll.presentDays}</div>
        </div>

      </div>
    </div>

    <!-- SALARY -->
    <div class="section">
      <div class="section-header">Salary Details</div>

      <div class="salary-box">

        <div class="card earnings">
          <div class="row"><span>Basic Salary</span><span>₹${payroll.monthlySalary.toFixed(2)}</span></div>
          <div class="row"><span>Allowances</span><span>₹0.00</span></div>
          <div class="row"><span>Bonus</span><span>₹0.00</span></div>
        </div>

        <div class="card deductions">
          <div class="row"><span>Absence</span><span>₹${payroll.deductions.toFixed(2)}</span></div>
          <div class="row"><span>Tax</span><span>₹0.00</span></div>
          <div class="row"><span>Other</span><span>₹0.00</span></div>
        </div>

      </div>
    </div>

    <!-- NET PAY -->
    <div class="net-pay">
      <span>Net Payable</span>
      <span>₹${payroll.finalSalary.toFixed(2)}</span>
    </div>

  </div>

  <div class="footer">
    This is a computer generated payslip and does not require signature.
  </div>

</div>

</body>
</html>
`;

    // ================= PUPPETEER =================
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
    });

    // IMPORTANT: ensure fonts are loaded
    await page.evaluate(() => document.fonts?.ready);

    // safety delay for rendering
    await new Promise((r) => setTimeout(r, 1200));

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
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // ================= EMAIL =================
    const { data, error } = await resend.emails.send({
      from: 'HRMS <onboarding@resend.dev>',
      to: [user.email],
      subject: `Your Payslip for ${monthName}`,
      html: `
        <p>Dear ${user.name},</p>
        <p>Please find attached your payslip for ${monthName}.</p>
        <p>Regards,<br>HR Team</p>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payslip sent successfully',
      data,
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