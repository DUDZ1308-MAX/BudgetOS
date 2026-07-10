import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { useMemo } from 'react';
import type { FeatureKey } from '@/billing/planMatrix';
import {
  hasFeatureAccess,
  getFeatureLimit,
  getTierUpgradeTarget,
  getMinimumTier,
  isTierAtLeast,
} from '@/billing/planMatrix';
import { canAccess } from '@/billing/access/billingGuard';
import { getRemaining } from '@/billing/usage/usageLimits';
import { getUsagePercent } from '@/billing/usage/usageBilling';

export function useFeatureAccess(feature: FeatureKey) {
  const tier = useSubscriptionStore((s) => s.tier);
  const usageCounts = useUsageStore((s) => {
    const count = s.getCount;
    return {
      ai_copilot: count('ai_request'),
      export_csv: count('export_csv'),
      export_pdf_excel: count('export_pdf_excel'),
    } as Partial<Record<FeatureKey, number>>;
  });

  const accessResult = useMemo(
    () => canAccess({ tier, usageCounts }, feature),
    [tier, usageCounts, feature],
  );

  const limit = useMemo(() => getFeatureLimit(tier, feature), [tier, feature]);
  const upgradeTarget = useMemo(() => getTierUpgradeTarget(tier, feature), [tier, feature]);
  const minimumTier = useMemo(() => getMinimumTier(feature), [feature]);
  const isAtLeast = useMemo(() => isTierAtLeast(tier, minimumTier), [tier, minimumTier]);

  return {
    hasAccess: hasFeatureAccess(tier, feature),
    granted: accessResult.granted,
    reason: accessResult.reason,
    limit,
    upgradeTarget,
    minimumTier,
    isAtLeast,
    usagePercent: getUsagePercent(tier, feature, (usageCounts[feature] as number) ?? 0),
    remaining: getRemaining(tier, feature, (usageCounts[feature] as number) ?? 0),
  };
}
