import { notificationService } from './notificationService';
import type { Notification } from '@/intelligence/types';

let lastGeneratedDate = '';

export function generateRecurringNotifications(
  recurrings: Array<{ id: string; name: string; amount: number; type: string; next_run: string; status: string }>,
  mortgages: Array<{ id: string; name: string; monthlyPayment: number }>,
  savingsGoals: Array<{ id: string; name: string; monthlyContribution: number }>,
  budgetAlerts: Array<{ categoryName: string; percentUsed: number }>,
): void {
  const today = new Date().toISOString().slice(0, 10);
  if (lastGeneratedDate === today) return;
  lastGeneratedDate = today;

  const notifications: Notification[] = [];
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().slice(0, 10);
  const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().slice(0, 10);

  // Bills due tomorrow
  for (const r of recurrings) {
    if (r.status !== 'active' || r.type === 'income') continue;
    if (r.next_run === tomorrow) {
      notifications.push({
        id: `bill-due-${r.id}-${tomorrow}`,
        type: 'cashflow',
        title: 'Bill Due Tomorrow',
        message: `${r.name} — $${Math.abs(Number(r.amount)).toFixed(2)} is due tomorrow`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { recurringId: r.id, amount: r.amount, dueDate: r.next_run },
      });
    }
  }

  // Bills due today
  for (const r of recurrings) {
    if (r.status !== 'active' || r.type === 'income') continue;
    if (r.next_run === today) {
      notifications.push({
        id: `bill-due-today-${r.id}-${today}`,
        type: 'cashflow',
        title: 'Bill Due Today',
        message: `${r.name} — $${Math.abs(Number(r.amount)).toFixed(2)} is due today`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { recurringId: r.id, amount: r.amount, dueDate: r.next_run },
      });
    }
  }

  // Upcoming income (within 7 days)
  for (const r of recurrings) {
    if (r.status !== 'active' || r.type !== 'income') continue;
    if (r.next_run >= today && r.next_run <= nextWeek) {
      notifications.push({
        id: `income-upcoming-${r.id}-${r.next_run}`,
        type: 'cashflow',
        title: 'Upcoming Pay',
        message: `${r.name} — $${Math.abs(Number(r.amount)).toFixed(2)} expected on ${new Date(r.next_run + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { recurringId: r.id, amount: r.amount, expectedDate: r.next_run },
      });
    }
  }

  // Mortgage payment due
  for (const m of mortgages) {
    const firstOfMonth = new Date().toISOString().slice(0, 7) + '-01';
    if (firstOfMonth === tomorrow) {
      notifications.push({
        id: `mortgage-due-${m.id}-${firstOfMonth}`,
        type: 'mortgage',
        title: 'Mortgage Payment Due Tomorrow',
        message: `${m.name} — $${m.monthlyPayment.toFixed(2)} is due tomorrow`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { mortgageId: m.id, amount: m.monthlyPayment },
      });
    }
  }

  // Upcoming savings transfers
  for (const g of savingsGoals) {
    if (g.monthlyContribution <= 0) continue;
    const contributionDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
    const daysUntil = Math.ceil((new Date(contributionDate).getTime() - now.getTime()) / 86400000);
    if (daysUntil <= 7 && daysUntil > 0) {
      notifications.push({
        id: `savings-transfer-${g.id}-${contributionDate}`,
        type: 'savings',
        title: 'Savings Transfer Due',
        message: `${g.name} — $${g.monthlyContribution.toFixed(2)} transfer scheduled for ${new Date(contributionDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { goalId: g.id, amount: g.monthlyContribution },
      });
    }
  }

  // Budget exceeded alerts
  for (const ba of budgetAlerts) {
    if (ba.percentUsed >= 100) {
      notifications.push({
        id: `budget-exceeded-${ba.categoryName}-${today}`,
        type: 'budget',
        title: 'Budget Exceeded',
        message: `${ba.categoryName} has exceeded its budget (${ba.percentUsed.toFixed(0)}% used)`,
        timestamp: new Date().toISOString(),
        read: false,
        archived: false,
        metadata: { category: ba.categoryName, percentUsed: ba.percentUsed },
      });
    }
  }

  if (notifications.length > 0) {
    notificationService.addMany(notifications);
  }
}
