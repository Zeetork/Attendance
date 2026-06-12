'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  CalendarOff, 
  Banknote, 
  FileBarChart, 
  Settings,
  User as UserIcon,
  LogOut,
  Receipt,
  X,
  Network,
  CalendarDays,
  Mail,
  Building2,
  Clock
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const adminLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Attendance', href: '/admin/attendance', icon: CalendarClock },
    { name: 'Leaves', href: '/admin/leaves', icon: CalendarOff },
    { name: 'Payroll', href: '/admin/payroll', icon: Banknote },
    { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
    { name: 'Organization', href: '/admin/organization', icon: Network },
    { name: 'Companies', href: '/admin/companies', icon: Building2 },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
    { name: 'Calendar Settings', href: '/admin/settings', icon: Settings },
    { name: 'Shifts', href: '/admin/shifts', icon: Clock },
    { name: 'Letters', href: '/admin/letters/create', icon: Mail },
  ];

  const employeeLinks = [
    { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', href: '/employee/attendance', icon: CalendarClock },
    { name: 'Leaves', href: '/employee/leaves', icon: CalendarOff },
    { name: 'Approval Center', href: '/employee/approvals', icon: Network },
    { name: 'Calendar', href: '/employee/calendar', icon: CalendarDays },
    { name: 'Payslips', href: '/employee/payslips', icon: Receipt },
    { name: 'Profile', href: '/employee/profile', icon: UserIcon },
  ];

  const links = ['admin', 'super_admin'].includes(role as string) ? adminLinks : employeeLinks;

  return (
    <div className="flex flex-col w-64 h-[100dvh] bg-neutral-900 border-r border-neutral-800 transition-all duration-300">
      <div className="flex items-center justify-between h-16 border-b border-neutral-800 px-4">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex-1 text-center lg:text-left">
          HRMS Portal
        </span>
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  isActive
                    ? 'bg-blue-600/10 text-blue-500'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <Icon
                  className={clsx(
                    isActive ? 'text-blue-500' : 'text-neutral-400 group-hover:text-white',
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-neutral-800 p-4">
        <button
          onClick={() => signOut()}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <div>
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-neutral-800 text-neutral-400 group-hover:text-white group-hover:bg-neutral-700 transition-colors">
                <LogOut className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-300 group-hover:text-white">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
