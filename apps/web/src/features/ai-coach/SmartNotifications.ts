import type { AiWarning, AiInsight, AiAchievement } from './types';

export type SmartNotificationType =
  | 'budget_exceeded'
  | 'income_received'
  | 'recurring_payment_due'
  | 'goal_reached'
  | 'mortgage_milestone'
  | 'emergency_fund_growing'
  | 'large_transaction'
  | 'upcoming_bill'
  | 'savings_milestone'
  | 'health_score_change'
  | 'cash_flow_alert';

export interface SmartNotification {
  id: string;
  type: SmartNotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  actionable: boolean;
  actionLabel?: string;
  actionRoute?: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  metadata?: Record<string, unknown>;
}

let notifCounter = 0;

function notifId(): string {
  notifCounter++;
  return `smart_notif_${Date.now()}_${notifCounter}`;
}

export function generateSmartNotifications(data: {
  warnings: AiWarning[];
  insights: AiInsight[];
  achievements: AiAchievement[];
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  upcomingBillsCount: number;
  upcomingBillsTotal: number;
  availableCash: number;
  healthScore: number;
}): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const now = new Date().toISOString();

  // Budget exceeded notifications
  for (const warning of data.warnings.filter((w) => w.category === 'budget')) {
    notifications.push({
      id: notifId(),
      type: 'budget_exceeded',
      title: warning.title,
      message: warning.message,
      severity: warning.severity === 'critical' ? 'critical' : 'warning',
      actionable: true,
      actionLabel: warning.suggestedAction ?? 'Review budget',
      actionRoute: '/budgets',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  // Cash flow alerts
  if (data.monthlyExpenses > data.monthlyIncome && data.monthlyIncome > 0) {
    const overspend = data.monthlyExpenses - data.monthlyIncome;
    notifications.push({
      id: notifId(),
      type: 'cash_flow_alert',
      title: 'Spending exceeds income',
      message: `You're spending ${fmt(overspend)} more than you earn this month. Consider reducing expenses.`,
      severity: 'critical',
      actionable: true,
      actionLabel: 'Review expenses',
      actionRoute: '/reports',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  // Upcoming bill reminders
  if (data.upcomingBillsCount > 0) {
    const cashRatio = data.availableCash > 0 ? data.upcomingBillsTotal / data.availableCash : 1;
    notifications.push({
      id: notifId(),
      type: 'upcoming_bill',
      title: `${data.upcomingBillsCount} upcoming bill${data.upcomingBillsCount > 1 ? 's' : ''}`,
      message: `You have ${fmt(data.upcomingBillsTotal)} in bills due soon${cashRatio > 0.5 ? '. Ensure sufficient funds.' : ''}.`,
      severity: cashRatio > 0.8 ? 'warning' : 'info',
      actionable: true,
      actionLabel: 'View upcoming',
      actionRoute: '/calendar',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  // Savings rate notification
  if (data.savingsRate >= 20) {
    notifications.push({
      id: notifId(),
      type: 'savings_milestone',
      title: 'Savings goal achieved',
      message: `You're saving ${data.savingsRate.toFixed(1)}% of income, exceeding the 20% target. Excellent work!`,
      severity: 'success',
      actionable: false,
      timestamp: now,
      read: false,
      dismissed: false,
    });
  } else if (data.savingsRate < 5 && data.savingsRate >= 0) {
    notifications.push({
      id: notifId(),
      type: 'cash_flow_alert',
      title: 'Very low savings rate',
      message: `Your savings rate is only ${data.savingsRate.toFixed(1)}%. This leaves no buffer for emergencies.`,
      severity: 'warning',
      actionable: true,
      actionLabel: 'View recommendations',
      actionRoute: '/ai-coach',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  // Health score notifications
  if (data.healthScore >= 80) {
    notifications.push({
      id: notifId(),
      type: 'health_score_change',
      title: 'Excellent financial health',
      message: `Your financial health score is ${data.healthScore}/100. Keep up the great work!`,
      severity: 'success',
      actionable: false,
      timestamp: now,
      read: false,
      dismissed: false,
    });
  } else if (data.healthScore < 40) {
    notifications.push({
      id: notifId(),
      type: 'health_score_change',
      title: 'Financial health needs attention',
      message: `Your financial health score is ${data.healthScore}/100. Review your recommendations.`,
      severity: 'warning',
      actionable: true,
      actionLabel: 'View coach',
      actionRoute: '/ai-coach',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  // Achievement notifications
  for (const achievement of data.achievements.slice(0, 3)) {
    notifications.push({
      id: notifId(),
      type: 'goal_reached',
      title: achievement.title,
      message: achievement.description,
      severity: 'success',
      actionable: false,
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  return notifications.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
