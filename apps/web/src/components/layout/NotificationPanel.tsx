import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/services/notifications/notificationService';
import type { Notification } from '@/intelligence/types';

const TYPE_ICONS: Record<string, string> = {
  budget: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  savings: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  mortgage: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  spending: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  cashflow: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  system: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  achievement: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  milestone: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const all = notificationService.getFiltered({ unreadOnly: false });
      setNotifications(all.slice(0, 20));
    };
    update();
    const unsub = notificationService.subscribe(update);
    return unsub;
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
        <button
          onClick={() => { notificationService.markAllRead(); }}
          className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">No notifications</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                notificationService.markRead(n.id);
                onClose();
              }}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                !n.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${TYPE_ICONS[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
                {n.type.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                  <p className={`text-xs font-medium ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {n.title}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{formatTime(n.timestamp)}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-700">
          <button
            onClick={handleViewAll}
            className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
