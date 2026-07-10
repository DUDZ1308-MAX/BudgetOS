export type SubscriptionTier = 'free' | 'pro' | 'premium';

export type BillingInterval = 'month' | 'year';

export interface FeatureDescription {
  key: string;
  label: string;
  included: boolean;
  limit?: number;
  limitLabel?: string;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyPricePerMonth: number;
  trialDays: number;
  popular: boolean;
  features: FeatureDescription[];
  color: string;
  badge?: string;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic budgeting',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyPricePerMonth: 0,
    trialDays: 0,
    popular: false,
    color: 'slate',
    features: [
      { key: 'budgets', label: 'Basic budgeting', included: true },
      { key: 'transactions', label: 'Transactions', included: true, limit: 50, limitLabel: '50/mo' },
      { key: 'accounts', label: 'Accounts', included: true, limit: 2, limitLabel: '2 max' },
      { key: 'savings_goals', label: 'Savings goals', included: true, limit: 1, limitLabel: '1 goal' },
      { key: 'mortgage', label: 'Mortgage tools', included: false },
      { key: 'ai_copilot', label: 'AI Copilot', included: true, limit: 5, limitLabel: '5 requests/mo' },
      { key: 'export_csv', label: 'CSV export', included: false },
      { key: 'export_pdf', label: 'PDF/Excel export', included: false },
      { key: 'cloud_sync', label: 'Cloud sync', included: false },
      { key: 'advanced_reports', label: 'Advanced reports', included: false },
      { key: 'forecasting', label: 'Forecasting engine', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full financial control',
    monthlyPrice: 9,
    yearlyPrice: 90,
    yearlyPricePerMonth: 7.5,
    trialDays: 14,
    popular: true,
    color: 'brand',
    badge: 'Most Popular',
    features: [
      { key: 'budgets', label: 'Full budgeting system', included: true },
      { key: 'transactions', label: 'Unlimited transactions', included: true },
      { key: 'accounts', label: 'Unlimited accounts', included: true },
      { key: 'savings_goals', label: 'Unlimited savings goals', included: true },
      { key: 'mortgage', label: 'Full mortgage tools', included: true },
      { key: 'ai_copilot', label: 'AI Copilot', included: true, limit: 200, limitLabel: '200 requests/mo' },
      { key: 'export_csv', label: 'CSV export', included: true },
      { key: 'export_pdf', label: 'PDF/Excel export', included: true },
      { key: 'cloud_sync', label: 'Priority cloud sync', included: true },
      { key: 'advanced_reports', label: 'Advanced reports', included: true },
      { key: 'forecasting', label: 'Forecasting engine', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum financial intelligence',
    monthlyPrice: 19,
    yearlyPrice: 190,
    yearlyPricePerMonth: 15.83,
    trialDays: 14,
    popular: false,
    color: 'amber',
    badge: 'Best Value',
    features: [
      { key: 'budgets', label: 'Full budgeting system', included: true },
      { key: 'transactions', label: 'Unlimited transactions', included: true },
      { key: 'accounts', label: 'Unlimited accounts', included: true },
      { key: 'savings_goals', label: 'Unlimited savings goals', included: true },
      { key: 'mortgage', label: 'Full mortgage tools', included: true },
      { key: 'ai_copilot', label: 'AI Copilot - Priority', included: true, limit: 1000, limitLabel: '1000 requests/mo' },
      { key: 'export_csv', label: 'CSV export', included: true },
      { key: 'export_pdf', label: 'PDF/Excel export', included: true },
      { key: 'cloud_sync', label: 'Priority cloud sync', included: true },
      { key: 'advanced_reports', label: 'Advanced reports + insights', included: true },
      { key: 'forecasting', label: 'Advanced forecasting', included: true },
      { key: 'early_access', label: 'Early access features', included: true },
    ],
  },
];

export function getPlan(tier: SubscriptionTier): PricingPlan {
  return PLANS.find((p) => p.id === tier) ?? PLANS[0]!;
}

export function getMaxTransactions(tier: SubscriptionTier): number | null {
  if (tier === 'free') return 50;
  return null;
}

export function getMaxAccounts(tier: SubscriptionTier): number | null {
  if (tier === 'free') return 2;
  return null;
}

export function getMaxSavingsGoals(tier: SubscriptionTier): number | null {
  if (tier === 'free') return 1;
  return null;
}

export function getAiRequestLimit(tier: SubscriptionTier): number {
  if (tier === 'free') return 5;
  if (tier === 'pro') return 200;
  return 1000;
}
