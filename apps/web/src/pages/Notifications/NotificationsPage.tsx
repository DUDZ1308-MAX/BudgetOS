import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notifications/notificationService';
import type { Notification } from '@/intelligence/types';

const TYPE_COLORS: Record<string, string> = {
  budget: 'border-l-red-500',
  savings: 'border-l-emerald-500',
  mortgage: 'border-l-blue-500',
  spending: 'border-l-amber-500',
  cashflow: 'border-l-orange-500',
  system: 'border-l-slate-500',
  achievement: 'border-l-purple-500',
  milestone: 'border-l-pink-500',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    const update = () => {
      const all = notificationService.getAll();
      let filtered = all;

      if (filter !== 'all') {
        filtered = filtered.filter((n) => n.type === filter);
      }

      if (unreadOnly) {
        filtered = filtered.filter((n) => !n.read);
      }

      setNotifications(filtered);
    };

    update();
    const unsub = notificationService.subscribe(update);
    return unsub;
  }, [filter, unreadOnly]);

  const handleMarkRead = (id: string) => {
    notificationService.markRead(id);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllRead();
  };

  const handleArchive = (id: string) => {
    notificationService.archive(id);
  };

  const handleDismiss = (id: string) => {
    notificationService.dismiss(id);
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const filters = ['all', 'budget', 'savings', 'mortgage', 'spending', 'cashflow', 'achievement', 'milestone', 'system'];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
        >
          Mark All Read
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications by type">
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            aria-controls="notifications-panel"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-slate-300 text-brand-600"
          />
          Unread only
        </label>
      </div>

      {notifications.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-400">No notifications</p>
        </div>
      ) : (
        <div id="notifications-panel" role="region" aria-label="Notifications list" className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-900 ${TYPE_COLORS[n.type] ?? 'border-l-slate-500'} ${
                !n.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    <h3 className={`text-sm font-medium ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {n.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatTime(n.timestamp)}</p>
                </div>
                <div className="flex gap-1">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                      title="Mark read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(n.id)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                    title="Archive"
                  >
                    📦
                  </button>
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-red-500"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
