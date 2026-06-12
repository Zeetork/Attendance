'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function LettersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Create Letter', href: '/admin/letters/create' },
    { name: 'Templates', href: '/admin/letters/templates' },
    { name: 'Sent Letters', href: '/admin/letters/sent' },
    { name: 'Email Logs', href: '/admin/letters/logs' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Letter Management</h1>
        <div className="border-b border-neutral-800">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={clsx(
                    isActive
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-300',
                    'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors'
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
