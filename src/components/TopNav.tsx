'use client';

import { useSession } from 'next-auth/react';
import { Bell, Menu } from 'lucide-react';
import useSWR from 'swr';
import CompanySwitcher from './CompanySwitcher';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TopNav({ onMenuClick, onNotificationClick }: { onMenuClick?: () => void, onNotificationClick?: () => void }) {
  const { data: session } = useSession();
  const { data } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 }); // Refresh every 30s
  
  const unreadCount = data?.notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-neutral-900 border-b border-neutral-800 shadow">
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center gap-3">
          <button 
            type="button" 
            className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-none">
            Welcome, {session?.user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <button
            type="button"
            onClick={onNotificationClick}
            className="relative bg-neutral-800 p-1 rounded-full text-neutral-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-neutral-900" />
            )}
          </button>

          {/* Company Switcher */}
          <div className="ml-3 hidden sm:block">
            <CompanySwitcher />
          </div>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <div className="max-w-xs bg-neutral-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white">
                <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-neutral-700">
                  <svg className="h-full w-full text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
