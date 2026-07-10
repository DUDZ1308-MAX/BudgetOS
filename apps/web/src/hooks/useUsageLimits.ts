export { useAIUsage as useUsageLimits } from './useAIUsage';

import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { useMemo } from 'react';
import { getFeatureLimit } from '@/billing/planMatrix';
import { getUsagePercent } from '@/billing/usage/usageBilling';

export function useAiUsageGuard() {
  const tier = useSubscriptionStore((s) => s.tier);
  const aiUsage = useUsageStore((s) => s.getAiUsage());

  const aiLimit = useMemo(() => getFeatureLimit(tier, 'ai_copilot') ?? 0, [tier]);
  const isExhausted = aiLimit > 0 && aiUsage >= aiLimit;
  const remaining = aiLimit > 0 ? Math.max(0, aiLimit - aiUsage) : Infinity;
  const usagePercent = getUsagePercent(tier, 'ai_copilot', aiUsage);

  return {
    canSendMessage: !isExhausted,
    isExhausted,
    aiUsage,
    aiLimit,
    remaining,
    usagePercent,
    tier,
    showUpgradePrompt: isExhausted && tier === 'free',
  };
}
