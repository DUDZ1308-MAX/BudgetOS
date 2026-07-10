import type { SubscriptionTier } from '@/billing/pricingPlans';
import { getFeatureLimit } from '@/billing/planMatrix';
import type { FeatureKey } from '@/billing/planMatrix';
import type { UsageAction } from '@/billing/usageTracker';

export interface UsageBill {
  feature: FeatureKey;
  action: UsageAction;
  count: number;
  limit: number | undefined;
  overage: number;
  estimatedCost: number;
}

export function calculateOverage(
  tier: SubscriptionTier,
  feature: FeatureKey,
  usageCount: number,
): number {
  const limit = getFeatureLimit(tier, feature);
  if (limit === undefined) return 0;
  return Math.max(0, usageCount - limit);
}

export function estimateBillingImpact(
  tier: SubscriptionTier,
  usageCounts: Partial<Record<FeatureKey, number>>,
): UsageBill[] {
  const bills: UsageBill[] = [];

  for (const [feature, count] of Object.entries(usageCounts)) {
    if (count === undefined) continue;
    const limit = getFeatureLimit(tier, feature as FeatureKey);
    const overage = limit !== undefined ? Math.max(0, count - limit) : 0;
    bills.push({
      feature: feature as FeatureKey,
      action: 'ai_request',
      count,
      limit,
      overage,
      estimatedCost: 0,
    });
  }

  return bills;
}

export function getUsagePercent(tier: SubscriptionTier, feature: FeatureKey, currentCount: number): number {
  const limit = getFeatureLimit(tier, feature);
  if (limit === undefined || limit <= 0) return 0;
  return Math.min(100, Math.round((currentCount / limit) * 100));
}
