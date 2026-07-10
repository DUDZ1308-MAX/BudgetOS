import type { SubscriptionTier } from './pricingPlans';

export type FeatureKey =
  | 'budgets'
  | 'transactions'
  | 'accounts'
  | 'savings_goals'
  | 'mortgage_tools'
  | 'ai_copilot'
  | 'export_csv'
  | 'export_pdf_excel'
  | 'export_data'
  | 'cloud_sync'
  | 'priority_sync'
  | 'advanced_reports'
  | 'savings_forecasting'
  | 'early_access'
  | 'forecasting_engine'
  | 'priority_ai';

export interface FeatureAccess {
  enabled: boolean;
  limit?: number;
  limitLabel?: string;
}

export type PlanMatrix = Record<FeatureKey, Record<SubscriptionTier, FeatureAccess>>;

export const PLAN_MATRIX: PlanMatrix = {
  budgets: {
    free: { enabled: true },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  transactions: {
    free: { enabled: true, limit: 50, limitLabel: '50/mo' },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  accounts: {
    free: { enabled: true, limit: 2, limitLabel: '2 max' },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  savings_goals: {
    free: { enabled: true, limit: 1, limitLabel: '1 goal' },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  mortgage_tools: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  ai_copilot: {
    free: { enabled: true, limit: 5, limitLabel: '5 requests/mo' },
    pro: { enabled: true, limit: 200, limitLabel: '200 requests/mo' },
    premium: { enabled: true, limit: 1000, limitLabel: '1000 requests/mo' },
  },
  export_csv: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  export_pdf_excel: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  export_data: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  cloud_sync: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  priority_sync: {
    free: { enabled: false },
    pro: { enabled: false },
    premium: { enabled: true },
  },
  advanced_reports: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  savings_forecasting: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  early_access: {
    free: { enabled: false },
    pro: { enabled: false },
    premium: { enabled: true },
  },
  forecasting_engine: {
    free: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true },
  },
  priority_ai: {
    free: { enabled: false },
    pro: { enabled: false },
    premium: { enabled: true },
  },
};

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

const TIER_NAMES: Record<FeatureKey, string> = {
  budgets: 'Budgets',
  transactions: 'Transactions',
  accounts: 'Accounts',
  savings_goals: 'Savings Goals',
  mortgage_tools: 'Mortgage Tools',
  ai_copilot: 'AI Copilot',
  export_csv: 'CSV Export',
  export_pdf_excel: 'PDF/Excel Export',
  export_data: 'Data Export',
  cloud_sync: 'Cloud Sync',
  priority_sync: 'Priority Sync',
  advanced_reports: 'Advanced Reports',
  savings_forecasting: 'Savings Forecasting',
  early_access: 'Early Access',
  forecasting_engine: 'Forecasting Engine',
  priority_ai: 'Priority AI',
};

export function getFeatureName(key: FeatureKey): string {
  return TIER_NAMES[key] ?? key;
}

export function hasFeatureAccess(tier: SubscriptionTier, feature: FeatureKey): boolean {
  const access = PLAN_MATRIX[feature]?.[tier];
  return access?.enabled === true;
}

export function getFeatureLimit(tier: SubscriptionTier, feature: FeatureKey): number | undefined {
  return PLAN_MATRIX[feature]?.[tier]?.limit;
}

export function getMinimumTier(feature: FeatureKey): SubscriptionTier {
  const tiers: SubscriptionTier[] = ['free', 'pro', 'premium'];
  for (const t of tiers) {
    if (PLAN_MATRIX[feature]?.[t]?.enabled) return t;
  }
  return 'premium';
}

export function getTierUpgradeTarget(current: SubscriptionTier, feature: FeatureKey): SubscriptionTier | null {
  if (hasFeatureAccess(current, feature)) return null;
  return getMinimumTier(feature);
}

export function isTierAtLeast(current: SubscriptionTier, minimum: SubscriptionTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[minimum];
}

export function getAllLimits(tier: SubscriptionTier): Partial<Record<FeatureKey, number>> {
  const limits: Partial<Record<FeatureKey, number>> = {};
  for (const key of Object.keys(PLAN_MATRIX) as FeatureKey[]) {
    const limit = getFeatureLimit(tier, key);
    if (limit !== undefined) limits[key] = limit;
  }
  return limits;
}
