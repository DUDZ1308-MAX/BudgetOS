import type { Notification, ProactiveAlert, Recommendation } from './types';

export function createNotifications(
  alerts: ProactiveAlert[],
  recommendations: Recommendation[],
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date().toISOString();

  for (const alert of alerts) {
    if (alert.dismissed) continue;
    notifications.push({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      read: alert.read,
      archived: false,
    });
  }

  for (const rec of recommendations) {
    if (rec.dismissed) continue;
    const mappedType = rec.category === 'income' || rec.category === 'general' ? 'system' : rec.category;
    notifications.push({
      id: `notif_${rec.id}`,
      type: mappedType,
      title: rec.title,
      message: rec.description,
      timestamp: rec.createdAt,
      read: false,
      archived: false,
    });
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function filterNotifications(
  notifications: Notification[],
  options: {
    types?: string[];
    unreadOnly?: boolean;
    search?: string;
  } = {},
): Notification[] {
  let filtered = [...notifications];

  if (options.types && options.types.length > 0) {
    filtered = filtered.filter((n) => options.types!.includes(n.type));
  }

  if (options.unreadOnly) {
    filtered = filtered.filter((n) => !n.read);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
    );
  }

  return filtered;
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function groupByType(notifications: Notification[]): Record<string, Notification[]> {
  const grouped: Record<string, Notification[]> = {};
  for (const n of notifications) {
    if (!grouped[n.type]) {
      grouped[n.type] = [];
    }
    grouped[n.type]!.push(n);
  }
  return grouped;
}
