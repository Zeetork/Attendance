import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.EMAIL_USER) {
  throw new Error("Missing environment variable: EMAIL_USER");
}

if (!process.env.EMAIL_PASS) {
  throw new Error("Missing environment variable: EMAIL_PASS");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    encoding?: string;
  }>;
}

export const sendEmail = async ({ to, subject, html, attachments }: SendEmailOptions) => {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  });
};
