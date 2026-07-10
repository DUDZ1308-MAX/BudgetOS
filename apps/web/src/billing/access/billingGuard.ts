import type { SubscriptionTier } from '@/billing/pricingPlans';
import type { FeatureKey } from '@/billing/planMatrix';
import { hasFeatureAccess, getFeatureLimit, getTierUpgradeTarget } from '@/billing/planMatrix';
import { checkAILimit } from '@/billing/usage/usageLimits';

export interface AccessResult {
  granted: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  upgradeTier?: SubscriptionTier;
}

export interface AccessContext {
  tier: SubscriptionTier;
  usageCounts?: Partial<Record<FeatureKey, number>>;
}

export function canAccess(
  context: AccessContext,
  feature: FeatureKey,
): AccessResult {
  const { tier, usageCounts } = context;

  const hasAccess = hasFeatureAccess(tier, feature);
  if (!hasAccess) {
    const upgradeTier = getTierUpgradeTarget(tier, feature) ?? undefined;
    return {
      granted: false,
      reason: `"${feature}" is not available on the ${tier} plan.`,
      upgradeTier,
    };
  }

  if (usageCounts && usageCounts[feature] !== undefined) {
    const currentCount = usageCounts[feature]!;
    const limit = getFeatureLimit(tier, feature);
    if (limit !== undefined && currentCount >= limit) {
      const upgradeTier = getTierUpgradeTarget(tier, feature) ?? undefined;
      return {
        granted: false,
        reason: `You've reached your ${feature} limit (${limit}).`,
        limit,
        current: currentCount,
        upgradeTier,
      };
    }
  }

  return { granted: true };
}

export function canAccessAI(context: AccessContext): AccessResult {
  return canAccess(context, 'ai_copilot');
}

export function guardAccess(
  context: AccessContext,
  feature: FeatureKey,
): asserts context is AccessContext & { granted: true } {
  const result = canAccess(context, feature);
  if (!result.granted) {
    throw new AccessDeniedError(result.reason ?? 'Access denied', feature, result.upgradeTier);
  }
}

export class AccessDeniedError extends Error {
  constructor(
    message: string,
    public readonly feature: FeatureKey,
    public readonly upgradeTier?: SubscriptionTier,
  ) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}
