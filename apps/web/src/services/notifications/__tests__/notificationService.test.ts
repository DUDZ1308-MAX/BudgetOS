import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService, NotificationService } from '../notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    const all = notificationService.getAll();
    all.forEach((n) => notificationService.dismiss(n.id));
  });

  it('starts empty', () => {
    expect(notificationService.getAll().length).toBe(0);
  });

  it('adds a notification', () => {
    notificationService.add({
      id: '1', type: 'budget', title: 'Test', message: 'Test', timestamp: new Date().toISOString(), read: false, archived: false,
    });
    expect(notificationService.getAll().length).toBe(1);
  });

  it('returns unread count', () => {
    notificationService.add({
      id: '1', type: 'budget', title: 'Test', message: 'Test', timestamp: new Date().toISOString(), read: false, archived: false,
    });
    expect(notificationService.getUnreadCount()).toBe(1);
  });

  it('marks as read', () => {
    notificationService.add({
      id: '1', type: 'budget', title: 'Test', message: 'Test', timestamp: new Date().toISOString(), read: false, archived: false,
    });
    notificationService.markRead('1');
    expect(notificationService.getUnreadCount()).toBe(0);
  });

  it('archives a notification', () => {
    notificationService.add({
      id: '1', type: 'budget', title: 'Test', message: 'Test', timestamp: new Date().toISOString(), read: false, archived: false,
    });
    notificationService.archive('1');
    const archived = notificationService.getAll().find((n) => n.id === '1');
    expect(archived?.archived).toBe(true);
  });
});
