'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import NotificationSlide from './NotificationSlide';

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const pathname = usePathname();

  // Close sidebar and notifications on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
    setNotificationOpen(false);
  }, [pathname]);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance; // swipe right to left
    const isRightSwipe = distance < -minSwipeDistance; // swipe left to right

    // Swipe left-to-right (right swipe)
    if (isRightSwipe) {
      if (notificationOpen) {
        setNotificationOpen(false); // close notifications
      } else if (touchStart < 100) {
        setSidebarOpen(true); // open sidebar
      }
    }

    // Swipe right-to-left (left swipe)
    if (isLeftSwipe) {
      if (sidebarOpen) {
        setSidebarOpen(false); // close sidebar
      } else if (typeof window !== 'undefined' && touchStart > window.innerWidth - 100) {
        setNotificationOpen(true); // open notifications
      }
    }
  };

  return (
    <div
      className="flex h-[100dvh] overflow-hidden bg-neutral-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition duration-300 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden min-w-0">
        <TopNav
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationClick={() => setNotificationOpen(true)}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none scroll-smooth">
          <div className="py-4 md:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      <NotificationSlide isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </div>
  );
}
