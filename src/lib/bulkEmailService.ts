import { generatePDF } from './pdfService';
import { sendEmail } from './emailService';
import GeneratedLetter from '@/models/GeneratedLetter';
import LetterEmailLog from '@/models/LetterEmailLog';
import User from '@/models/User';

interface BulkSendParams {
  templateId: string;
  templateSubject: string;
  employeesData: {
    employeeId: string;
    email: string;
    name: string;
    htmlContent: string;
    variables: Record<string, any>;
  }[];
  generatedById: string;
}

export async function processBulkLetters({
  templateId,
  templateSubject,
  employeesData,
  generatedById,
}: BulkSendParams) {
  const results = [];

  for (const empData of employeesData) {
    let status: 'PENDING' | 'SENT' | 'FAILED' = 'PENDING';
    let errorMessage = '';
    let generatedLetterId = null;

    try {
      // 1. Generate PDF
      const pdfBuffer = await generatePDF(empData.htmlContent);

      // 2. Save Generated Letter to History
      const generatedLetter = await GeneratedLetter.create({
        employeeId: empData.employeeId,
        templateId,
        status: 'SENT',
        variables: empData.variables,
        content: empData.htmlContent,
        generatedAt: new Date(),
        generatedBy: generatedById,
      });
      generatedLetterId = generatedLetter._id;

      // 3. Send Email
      await sendEmail({
        to: empData.email,
        subject: templateSubject,
        html: `<p>Dear ${empData.name},</p><p>Please find attached your letter.</p><br><p>Regards,<br>HR Team</p>`,
        attachments: [
          {
            filename: `${templateSubject.replace(/\s+/g, '_')}_${empData.name.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            encoding: 'base64',
          },
        ],
      });

      status = 'SENT';
    } catch (error: any) {
      status = 'FAILED';
      errorMessage = error.message;
    }

    // 4. Log the Email
    await LetterEmailLog.create({
      employeeId: empData.employeeId,
      templateId,
      generatedLetterId,
      email: empData.email,
      subject: templateSubject,
      status,
      errorMessage: errorMessage || undefined,
      sentAt: status === 'SENT' ? new Date() : undefined,
    });

    results.push({ employeeId: empData.employeeId, status, errorMessage });
  }

  return results;
}
