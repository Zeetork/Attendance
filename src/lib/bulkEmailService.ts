import GeneratedLetter from '@/models/GeneratedLetter';
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
      // Just save Generated Letter to History so it reflects in the UI for employees/admins
      const generatedLetter = await GeneratedLetter.create({
        employeeId: empData.employeeId,
        templateId,
        status: 'SENT', // We keep 'SENT' to indicate it has been successfully assigned
        variables: empData.variables,
        content: empData.htmlContent,
        generatedAt: new Date(),
        generatedBy: generatedById,
      });
      generatedLetterId = generatedLetter._id;

      // Note: We removed the email sending logic (sendEmail and LetterEmailLog) as requested.
      // The letter is now only saved to the database to be viewed/downloaded via the website.

      status = 'SENT';
    } catch (error: any) {
      status = 'FAILED';
      errorMessage = error.message;
    }

    results.push({ employeeId: empData.employeeId, status, errorMessage });
  }

  return results;
}
