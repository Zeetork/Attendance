import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument } from '@/components/PayslipDocument';

export async function generatePayslipPdf(payroll: any, user: any, company: any): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <PayslipDocument payroll={payroll} user={user} company={company} />
  );

  return pdfBuffer;
}
