import type { CategoryType } from '../types/enums';

export interface DefaultCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#16a34a' },
  { name: 'Refunds', type: 'income', icon: 'rotate-ccw', color: '#15803d' },
  { name: 'Gifts', type: 'income', icon: 'gift', color: '#eab308' },
  { name: 'Investment', type: 'income', icon: 'trending-up', color: '#a855f7' },
  { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#6b7280' },

  { name: 'Housing', type: 'expense', icon: 'home', color: '#ef4444' },
  { name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#f97316' },
  { name: 'Dining', type: 'expense', icon: 'utensils', color: '#eab308' },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#84cc16' },
  { name: 'Utilities', type: 'expense', icon: 'zap', color: '#22c55e' },
  { name: 'Insurance', type: 'expense', icon: 'shield', color: '#14b8a6' },
  { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#06b6d4' },
  { name: 'Entertainment', type: 'expense', icon: 'tv', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#6366f1' },
  { name: 'Education', type: 'expense', icon: 'book', color: '#8b5cf6' },
  { name: 'Savings', type: 'expense', icon: 'piggy-bank', color: '#a855f7' },
  { name: 'Debt', type: 'expense', icon: 'credit-card', color: '#ec4899' },
  { name: 'Personal Care', type: 'expense', icon: 'smile', color: '#f43f5e' },
  { name: 'Travel', type: 'expense', icon: 'plane', color: '#0ea5e9' },
  { name: 'Subscriptions', type: 'expense', icon: 'repeat', color: '#64748b' },
  { name: 'Other Expense', type: 'expense', icon: 'minus-circle', color: '#6b7280' },
];
