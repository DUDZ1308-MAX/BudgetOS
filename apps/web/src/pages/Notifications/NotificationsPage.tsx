import { useState, useCallback } from 'react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useArchiveNotification, useDeleteNotification } from '@/hooks/useNotifications';
import type { Notification, NotificationCategory, NotificationPriority } from '@budgetos/database';

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

const PRIORITY_BADGES: Record<NotificationPriority, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Critical' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'High' },
  medium: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Medium' },
  low: { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-500 dark:text-slate-500', label: 'Low' },
};

const CATEGORIES: NotificationCategory[] = ['budget', 'savings', 'mortgage', 'spending', 'cashflow', 'system', 'achievement', 'milestone'];

export function NotificationsPage() {
  const { data: rawNotifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const archiveNotif = useArchiveNotification();
  const deleteNotif = useDeleteNotification();

  const [filter, setFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  const notifications = rawNotifications.filter((n) => {
    if (filter !== 'all' && n.category !== filter) return false;
    if (unreadOnly && n.is_read) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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

  const handleMarkRead = useCallback((id: string) => markRead.mutate(id), [markRead]);
  const handleMarkAllRead = useCallback(() => markAllRead.mutate(), [markAllRead]);
  const handleArchive = useCallback((id: string) => archiveNotif.mutate(id), [archiveNotif]);
  const handleDelete = useCallback((id: string) => deleteNotif.mutate(id), [deleteNotif]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        </div>
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

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

      <div className="mb-3">
        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications by category">
        <button
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            filter === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const count = rawNotifications.filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={filter === cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                filter === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {cat}{count > 0 && ` (${count})`}
            </button>
          );
        })}
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
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-white">No notifications</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {search || filter !== 'all' || unreadOnly ? 'Try adjusting your filters' : "You're all caught up!"}
            </p>
          </div>
        </div>
      ) : (
        <div id="notifications-panel" role="region" aria-label="Notifications list" className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-900 ${TYPE_COLORS[n.category] ?? 'border-l-slate-500'} ${
                !n.is_read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    <h3 className={`text-sm font-medium ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {n.title}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_BADGES[n.priority].bg} ${PRIORITY_BADGES[n.priority].text}`}>
                      {PRIORITY_BADGES[n.priority].label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{n.description}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <p className="text-xs text-slate-400">{formatTime(n.created_at)}</p>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400 capitalize">
                      {n.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                      title="Mark read"
                    >
                      &#10003;
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(n.id)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                    title="Archive"
                  >
                    &#128230;
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-red-500"
                    title="Delete"
                  >
                    &#10005;
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
