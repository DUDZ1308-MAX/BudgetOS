import type { Notification } from '@/intelligence/types';
import { filterNotifications, getUnreadCount } from '@/intelligence/NotificationEngine';

const STORAGE_KEY = 'budgetos_notifications';

export class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<() => void> = new Set();

  init(): void {
    this.load();
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return getUnreadCount(this.notifications);
  }

  getFiltered(options: {
    types?: string[];
    unreadOnly?: boolean;
    search?: string;
  } = {}): Notification[] {
    return filterNotifications(this.notifications, options);
  }

  add(notification: Notification): void {
    this.notifications.unshift(notification);
    this.save();
    this.notify();
  }

  addMany(notifications: Notification[]): void {
    const existingIds = new Set(this.notifications.map((n) => n.id));
    const newOnes = notifications.filter((n) => !existingIds.has(n.id));
    if (newOnes.length === 0) return;
    this.notifications = [...newOnes, ...this.notifications];
    this.save();
    this.notify();
  }

  markRead(id: string): void {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n && !n.read) {
      n.read = true;
      this.save();
      this.notify();
    }
  }

  markAllRead(): void {
    let changed = false;
    for (const n of this.notifications) {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) {
      this.save();
      this.notify();
    }
  }

  archive(id: string): void {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n && !n.archived) {
      n.archived = true;
      this.save();
      this.notify();
    }
  }

  dismiss(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.save();
    this.notify();
  }

  clearArchived(): void {
    this.notifications = this.notifications.filter((n) => !n.archived);
    this.save();
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.notifications = JSON.parse(raw);
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch { /* ignore */ }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const notificationService = new NotificationService();
