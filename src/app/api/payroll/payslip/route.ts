import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import User from '@/models/User';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const payrollId = searchParams.get('id');

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

    // Check authorization: Only admin or the owner can view this payslip
    if (!['admin', 'super_admin'].includes(session.user.role) && session.user.id !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monthName = format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${user.name} - ${monthName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
          .company-name { font-size: 14px; color: #666; }
          .payslip-title { font-size: 20px; font-weight: bold; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .details-table th, .details-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          .details-table th { background-color: #f8fafc; font-weight: 600; width: 25%; }
          .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .salary-table th, .salary-table td { padding: 12px; border: 1px solid #ddd; }
          .salary-table th { background-color: #2563eb; color: white; text-align: left; }
          .total-row { font-weight: bold; background-color: #f8fafc; }
          .net-pay { font-size: 18px; color: #16a34a; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ZohoHRMS Clone</div>
          <div class="company-name">123 Tech Park, Innovation City, IN 400001</div>
          <div class="payslip-title">Payslip for ${monthName}</div>
        </div>

        <table class="details-table">
          <tr>
            <th>Employee Name</th>
            <td>${user.name}</td>
            <th>Employee ID</th>
            <td>${user.employeeId}</td>
          </tr>
          <tr>
            <th>Designation</th>
            <td>${user.designation}</td>
            <th>Department</th>
            <td>${user.department}</td>
          </tr>
          <tr>
            <th>Date of Joining</th>
            <td>${format(new Date(user.joiningDate), 'dd MMM yyyy')}</td>
            <th>Working Days</th>
            <td>${payroll.totalWorkingDays} (Present: ${payroll.presentDays})</td>
          </tr>
        </table>

        <table class="salary-table">
          <thead>
            <tr>
              <th>Earnings</th>
              <th>Amount (₹)</th>
              <th>Deductions</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>${(payroll.monthlySalary || 0).toFixed(2)}</td>
              <td>Absence (${payroll.deductionDays || 0} days)</td>
              <td>${((payroll.deductions || payroll.deductionAmount || 0) - (payroll.salaryDeductionsSnapshot?.esi || 0) - (payroll.salaryDeductionsSnapshot?.loan || 0)).toFixed(2)}</td>
            </tr>
            ${payroll.salaryDeductionsSnapshot?.esi ? `
            <tr>
              <td></td>
              <td></td>
              <td>ESI</td>
              <td>${payroll.salaryDeductionsSnapshot.esi.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${payroll.salaryDeductionsSnapshot?.loan ? `
            <tr>
              <td></td>
              <td></td>
              <td>Loan</td>
              <td>${payroll.salaryDeductionsSnapshot.loan.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td>Total Earnings</td>
              <td>${(payroll.monthlySalary || 0).toFixed(2)}</td>
              <td>Total Deductions</td>
              <td>${(payroll.deductions || payroll.deductionAmount || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="net-pay">
          Net Payable: ₹${(payroll.finalSalary || 0).toFixed(2)}
        </div>

        <div class="footer">
          This is a computer-generated document. No signature is required.
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Payslip_${user.employeeId}_${monthName}.pdf`,
      },
    });

  } catch (error: any) {
    console.error('Payslip generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
