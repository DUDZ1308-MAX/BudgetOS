import { create } from 'zustand';
import { trackUsage, getUsageCount, getUsageByAction, hasReachedLimit } from '@/billing/usageTracker';
import type { UsageAction } from '@/billing/usageTracker';
import type { SubscriptionTier } from '@/billing/pricingPlans';
import { getAiRequestLimit } from '@/billing/pricingPlans';

interface UsageState {
  userId: string | null;
  setUserId: (id: string | null) => void;
  track: (action: UsageAction, metadata?: Record<string, unknown>) => void;
  getCount: (action: UsageAction) => number;
  getAiUsage: () => number;
  getAiLimit: (tier: SubscriptionTier) => number;
  hasAiCapacity: (tier: SubscriptionTier) => boolean;
  isExportAllowed: (tier: SubscriptionTier) => boolean;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  userId: null,

  setUserId: (id) => set({ userId: id }),

  track: (action, metadata) => {
    const { userId } = get();
    if (userId) {
      trackUsage(userId, action, metadata);
    }
  },

  getCount: (action) => {
    const { userId } = get();
    if (!userId) return 0;
    return getUsageCount(userId, action);
  },

  getAiUsage: () => {
    const { userId } = get();
    if (!userId) return 0;
    return getUsageCount(userId, 'ai_request');
  },

  getAiLimit: (tier) => {
    return getAiRequestLimit(tier);
  },

  hasAiCapacity: (tier) => {
    const { userId } = get();
    if (!userId) return false;
    const limit = getAiRequestLimit(tier);
    if (limit === Infinity) return true;
    return !hasReachedLimit(userId, 'ai_request', limit);
  },

  isExportAllowed: (tier) => {
    if (tier === 'free') return false;
    return true;
  },
}));
