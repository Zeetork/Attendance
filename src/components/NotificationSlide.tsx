'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Check, Trash2, Loader2, Circle } from 'lucide-react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface NotificationSlideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSlide({ isOpen, onClose }: NotificationSlideProps) {
  const { data, error, isLoading, mutate } = useSWR(isOpen ? '/api/notifications' : null, fetcher);
  const [marking, setMarking] = useState(false);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch('/api/notifications?action=mark-all-read', { method: 'PUT' });
      mutate();
    } finally {
      setMarking(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      mutate();
    } catch (e) { }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-card-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground font-bold text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive font-bold text-sm">Failed to load notifications</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-bold space-y-3">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif: any) => (
                <div
                  key={notif._id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.isRead && (
                      <div className="mt-1.5 flex-shrink-0">
                        <Circle className="h-2 w-2 fill-primary text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'text-foreground font-bold' : 'text-muted-foreground font-bold'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground font-bold">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif._id)}
                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif._id);
                            onClose();
                          }}
                          className="mt-2 inline-block font-bold text-xs text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:underline"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="p-4 border-t border-border bg-muted/30">
            <button
              onClick={markAllRead}
              disabled={marking}
              className="w-full flex justify-center items-center px-4 py-2 min-h-[44px] bg-background border border-border text-foreground rounded-xl hover:bg-muted transition-colors text-sm font-bold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {marking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
}
