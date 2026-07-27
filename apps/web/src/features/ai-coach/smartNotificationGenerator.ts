import type { NotificationInsert, NotificationCategory, NotificationPriority } from '@budgetos/database';
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

interface SmartNotification {
  type: SmartNotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  description: string;
  icon: string;
  actionable: boolean;
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
}

const SEVERITY_TO_PRIORITY: Record<string, NotificationPriority> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  warning: 'high',
  info: 'medium',
  success: 'low',
};

function toNotificationInsert(n: SmartNotification): NotificationInsert {
  return {
    title: n.title,
    description: n.description,
    category: n.category,
    priority: n.priority,
    icon: n.icon,
    is_read: false,
    is_archived: false,
    metadata: {
      smartType: n.type,
      actionable: n.actionable,
      actionLabel: n.actionLabel,
      actionRoute: n.actionRoute,
      fingerprint: generateFingerprint(n.category, n.type, n.title),
      ...n.metadata,
    },
  };
}

function generateFingerprint(category: string, smartType: string, title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${category}:${smartType}:${date}`;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

  for (const warning of data.warnings.filter((w) => w.category === 'budget')) {
    notifications.push({
      type: 'budget_exceeded',
      category: 'budget',
      priority: SEVERITY_TO_PRIORITY[warning.severity] ?? 'medium',
      title: warning.title,
      description: warning.message,
      icon: 'red-500',
      actionable: true,
      actionLabel: warning.suggestedAction ?? 'Review budget',
      actionRoute: '/budgets',
    });
  }

  if (data.monthlyExpenses > data.monthlyIncome && data.monthlyIncome > 0) {
    const overspend = data.monthlyExpenses - data.monthlyIncome;
    notifications.push({
      type: 'cash_flow_alert',
      category: 'cashflow',
      priority: 'critical',
      title: 'Spending exceeds income',
      description: `You're spending ${fmt(overspend)} more than you earn this month. Consider reducing expenses.`,
      icon: 'orange-500',
      actionable: true,
      actionLabel: 'Review expenses',
      actionRoute: '/reports',
    });
  }

  if (data.upcomingBillsCount > 0) {
    const cashRatio = data.availableCash > 0 ? data.upcomingBillsTotal / data.availableCash : 1;
    notifications.push({
      type: 'upcoming_bill',
      category: 'cashflow',
      priority: cashRatio > 0.8 ? 'high' : 'medium',
      title: `${data.upcomingBillsCount} upcoming bill${data.upcomingBillsCount > 1 ? 's' : ''}`,
      description: `You have ${fmt(data.upcomingBillsTotal)} in bills due soon${cashRatio > 0.5 ? '. Ensure sufficient funds.' : ''}.`,
      icon: 'amber-500',
      actionable: true,
      actionLabel: 'View upcoming',
      actionRoute: '/calendar',
    });
  }

  if (data.savingsRate >= 20) {
    notifications.push({
      type: 'savings_milestone',
      category: 'savings',
      priority: 'low',
      title: 'Savings goal achieved',
      description: `You're saving ${data.savingsRate.toFixed(1)}% of income, exceeding the 20% target. Excellent work!`,
      icon: 'emerald-500',
      actionable: false,
    });
  } else if (data.savingsRate < 5 && data.savingsRate >= 0) {
    notifications.push({
      type: 'cash_flow_alert',
      category: 'savings',
      priority: 'high',
      title: 'Very low savings rate',
      description: `Your savings rate is only ${data.savingsRate.toFixed(1)}%. This leaves no buffer for emergencies.`,
      icon: 'amber-500',
      actionable: true,
      actionLabel: 'View recommendations',
      actionRoute: '/ai-coach',
    });
  }

  if (data.healthScore >= 80) {
    notifications.push({
      type: 'health_score_change',
      category: 'achievement',
      priority: 'low',
      title: 'Excellent financial health',
      description: `Your financial health score is ${data.healthScore}/100. Keep up the great work!`,
      icon: 'purple-500',
      actionable: false,
    });
  } else if (data.healthScore < 40) {
    notifications.push({
      type: 'health_score_change',
      category: 'milestone',
      priority: 'high',
      title: 'Financial health needs attention',
      description: `Your financial health score is ${data.healthScore}/100. Review your recommendations.`,
      icon: 'pink-500',
      actionable: true,
      actionLabel: 'View coach',
      actionRoute: '/ai-coach',
    });
  }

  for (const achievement of data.achievements.slice(0, 3)) {
    notifications.push({
      type: 'goal_reached',
      category: 'achievement',
      priority: 'low',
      title: achievement.title,
      description: achievement.description,
      icon: 'purple-500',
      actionable: false,
      metadata: { achievementId: achievement.id },
    });
  }

  return notifications.sort((a, b) => {
    const order: Record<NotificationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

export function toNotificationInserts(smartNotifs: SmartNotification[]): NotificationInsert[] {
  return smartNotifs.map(toNotificationInsert);
}
