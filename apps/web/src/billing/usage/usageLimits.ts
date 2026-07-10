import type { SubscriptionTier } from '@/billing/pricingPlans';
import type { FeatureKey } from '@/billing/planMatrix';
import { getFeatureLimit, hasFeatureAccess } from '@/billing/planMatrix';

export interface LimitCheck {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  upgradeTier?: SubscriptionTier;
}

export function checkFeatureLimit(
  tier: SubscriptionTier,
  feature: FeatureKey,
  currentCount: number,
): LimitCheck {
  const hasAccess = hasFeatureAccess(tier, feature);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: `Feature "${feature}" is not available on your plan.`,
      upgradeTier: getUpgradeForFeature(feature, tier),
    };
  }

  const limit = getFeatureLimit(tier, feature);
  if (limit !== undefined && currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached the ${limit} ${feature} limit for your plan.`,
      limit,
      current: currentCount,
      upgradeTier: getUpgradeForFeature(feature, tier),
    };
  }

  return { allowed: true, limit, current: currentCount };
}

export function checkAILimit(tier: SubscriptionTier, currentRequests: number): LimitCheck {
  return checkFeatureLimit(tier, 'ai_copilot', currentRequests);
}

export function checkExportLimit(tier: SubscriptionTier, exportType: FeatureKey, currentCount: number): LimitCheck {
  return checkFeatureLimit(tier, exportType, currentCount);
}

function getUpgradeForFeature(feature: FeatureKey, current: SubscriptionTier): SubscriptionTier | undefined {
  const tiers: SubscriptionTier[] = ['free', 'pro', 'premium'];
  const currentIdx = current === 'free' ? 0 : current === 'pro' ? 1 : 2;
  for (let i = currentIdx + 1; i < tiers.length; i++) {
    const t = tiers[i]!;
    if (hasFeatureAccess(t, feature)) return t;
  }
  return undefined;
}

export function getRemaining(tier: SubscriptionTier, feature: FeatureKey, currentCount: number): number {
  const limit = getFeatureLimit(tier, feature);
  if (limit === undefined) return Infinity;
  return Math.max(0, limit - currentCount);
}
