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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-4">Letter Management</h1>
        <div className="border-b border-border overflow-x-auto hide-scrollbar">
          <nav className="-mb-px flex space-x-6 md:space-x-8 min-w-max px-1">
            {tabs.map((tab) => {
              const isActive = pathname?.startsWith(tab.href) ?? false;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={clsx(
                    isActive
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border font-bold',
                    'whitespace-nowrap pb-4 px-1 border-b-2 text-sm transition-colors'
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
