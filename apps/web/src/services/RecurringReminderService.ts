import { notificationService } from '@/services/notifications/notificationService';
import { recurringApi } from '@/lib/api/recurring';

let reminderCounter = 0;

export class RecurringReminderService {
  static async processReminders(userId: string): Promise<void> {
    const recurrings = await recurringApi.list(userId);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (const rt of recurrings) {
      if (rt.status !== 'active' || !rt.reminder_type) continue;

      const dueDate = new Date(rt.next_run + 'T00:00:00');
      let reminderDate: Date | null = null;

      switch (rt.reminder_type) {
        case 'today':
          reminderDate = dueDate;
          break;
        case 'day_before': {
          const d = new Date(dueDate);
          d.setDate(d.getDate() - 1);
          reminderDate = d;
          break;
        }
        case 'three_days_before': {
          const d = new Date(dueDate);
          d.setDate(d.getDate() - 3);
          reminderDate = d;
          break;
        }
        case 'week_before': {
          const d = new Date(dueDate);
          d.setDate(d.getDate() - 7);
          reminderDate = d;
          break;
        }
      }

      if (!reminderDate) continue;
      const reminderStr = reminderDate.toISOString().split('T')[0];
      if (reminderStr !== todayStr) continue;

      const existingNotifications = notificationService.getFiltered();
      const alreadyNotified = existingNotifications.some(
        (n) => n.title?.includes(rt.name) && n.title?.includes('reminder'),
      );
      if (alreadyNotified) continue;

      const amount = Math.abs(rt.amount);
      const typeLabel = rt.type === 'income' ? 'income' : 'bill';
      reminderCounter++;

      notificationService.add({
        id: `reminder-${rt.id}-${reminderCounter}`,
        type: rt.type === 'income' ? 'savings' : 'spending',
        title: `${rt.name} reminder`,
        message: `Your ${typeLabel} "${rt.name}" for $${amount.toFixed(2)} is due ${rt.reminder_type === 'today' ? 'today' : 'soon'}.`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { recurringId: rt.id, amount, dueDate: rt.next_run },
      });
    }
  }
}
