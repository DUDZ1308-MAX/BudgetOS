import { create } from 'zustand';
import type { Notification } from '@/intelligence/types';
import { filterNotifications, groupByType } from '@/intelligence/NotificationEngine';

const STORAGE_KEY = 'budgetos_notifications';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addMany: (notifications: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  archive: (id: string) => void;
  dismiss: (id: string) => void;
  filterByType: (type: string) => Notification[];
  getGroupedByType: () => Record<string, Notification[]>;
  load: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => {
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    persist(notifications);
  },
  addMany: (newNotifs) => {
    const existing = new Map(get().notifications.map((n) => [n.id, n]));
    for (const n of newNotifs) {
      if (!existing.has(n.id)) existing.set(n.id, n);
    }
    const updated = Array.from(existing.values());
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    persist(updated);
  },
  markRead: (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    persist(updated);
  },
  markAllRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    persist(updated);
  },
  archive: (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, archived: true } : n));
    set({ notifications: updated });
    persist(updated);
  },
  dismiss: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    persist(updated);
  },
  filterByType: (type) => filterNotifications(get().notifications, { types: [type] }),
  getGroupedByType: () => groupByType(get().notifications),
  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const notifications: Notification[] = JSON.parse(raw);
        set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
      }
    } catch { /* ignore */ }
  },
}));

function persist(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}
