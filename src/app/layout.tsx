import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata = {
  title: 'HRMS',
  description: 'Employee Attendance & Payroll Management System',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-white min-h-screen font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body >
    </html>
  );
}
