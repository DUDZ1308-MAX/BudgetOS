import { useUsageStore } from '@/stores/usage';
import { useSubscriptionStore } from '@/stores/subscription';
import { useMemo, useCallback } from 'react';
import { checkAILimit } from '@/billing/usage/usageLimits';
import { getUsagePercent } from '@/billing/usage/usageBilling';
import { getFeatureLimit } from '@/billing/planMatrix';

export function useAIUsage() {
  const tier = useSubscriptionStore((s) => s.tier);
  const aiUsage = useUsageStore((s) => s.getAiUsage());
  const track = useUsageStore((s) => s.track);

  const aiLimit = useMemo(() => getFeatureLimit(tier, 'ai_copilot'), [tier]);
  const remaining = aiLimit !== undefined ? Math.max(0, aiLimit - aiUsage) : Infinity;
  const isExhausted = aiLimit !== undefined && aiUsage >= aiLimit;
  const usagePercent = getUsagePercent(tier, 'ai_copilot', aiUsage);

  const limitCheck = useMemo(() => checkAILimit(tier, aiUsage), [tier, aiUsage]);

  const trackRequest = useCallback(() => {
    track('ai_request');
  }, [track]);

  return {
    aiUsage,
    aiLimit,
    remaining,
    isExhausted,
    usagePercent,
    limitCheck,
    trackRequest,
    tier,
  };
}
