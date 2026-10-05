'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Send, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { requestWebPushPermission } from '@/lib/webPushNotifications';

interface WebPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WebPushModal({ isOpen, onClose }: WebPushModalProps) {
  const [title, setTitle] = useState('TruFlow Attendance Notification');
  const [body, setBody] = useState('This is a test web push notification from the admin portal.');
  const [target, setTarget] = useState<'me' | 'all'>('me');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{ userTokensCount: number; totalTokensCount: number } | null>(null);
  const [permission, setPermission] = useState<string>('default');

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    // Fetch active push token stats
    fetch('/api/notifications/test')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats({
            userTokensCount: data.userTokensCount,
            totalTokensCount: data.totalTokensCount,
          });
        }
      })
      .catch((e) => console.warn('Could not fetch push stats', e));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    try {
      const token = await requestWebPushPermission();
      if (token) {
        setPermission('granted');
        toast.success('Web push notifications enabled on this browser!');
        // Refresh stats
        const res = await fetch('/api/notifications/test');
        const data = await res.json();
        if (data.success) setStats({ userTokensCount: data.userTokensCount, totalTokensCount: data.totalTokensCount });
      } else {
        toast.error('Permission not granted or dismissed.');
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
      }
    } catch (err: any) {
      toast.error('Failed to enable push notifications');
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message text are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Push notification delivered to ${data.result?.sent || 0} device(s)!`);
        onClose();
      } else {
        toast.error(data.error || 'Failed to dispatch push notification.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground text-base">Send Web Push Notification</h3>
              <p className="text-xs text-muted-foreground">Broadcast or test live Firebase notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendPush} className="p-6 space-y-4">
          {/* Browser Permission Alert if not granted */}
          {permission !== 'granted' && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Your current browser hasn&apos;t enabled notifications yet.</span>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium shadow-sm transition-colors"
              >
                Enable
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground border border-border">
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone className="h-3.5 w-3.5" />
              Your registered devices: <strong className="text-foreground">{stats?.userTokensCount ?? '...'}</strong>
            </span>
            <span className="font-medium">
              Total system devices: <strong className="text-foreground">{stats?.totalTokensCount ?? '...'}</strong>
            </span>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Recipients</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTarget('me')}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  target === 'me'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <div>Send to My Device</div>
                <div className="text-[11px] opacity-75">Test on your active browser</div>
              </button>
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  target === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <div>Send to All Employees</div>
                <div className="text-[11px] opacity-75">Broadcast to all devices</div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Attendance Reminder"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              required
            />
          </div>

          {/* Message / Text */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Message Text</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter push notification message..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Push Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
