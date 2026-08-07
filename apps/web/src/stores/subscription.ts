import { create } from 'zustand';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface SubscriptionState {
  tier: SubscriptionTier;
  interval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  initialized: boolean;
  isLoading: boolean;

  setSubscription: (data: Partial<SubscriptionState>) => void;
  setInitialized: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  reset: () => void;
  isActive: () => boolean;
  isOnTrial: () => boolean;
}

function defaultState() {
  return {
    tier: 'free' as SubscriptionTier,
    interval: 'month' as BillingInterval,
    status: 'active' as SubscriptionStatus,
    currentPeriodEnd: null as string | null,
    trialEnd: null as string | null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null as string | null,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...defaultState(),
  initialized: false,
  isLoading: false,

  setSubscription: (data) => set({ ...data }),

  setInitialized: (val) => set({ initialized: val }),

  setLoading: (val) => set({ isLoading: val }),

  reset: () => set({ ...defaultState(), initialized: true }),

  isActive: () => {
    const state = get();
    return state.status === 'active' || state.status === 'trialing';
  },

  isOnTrial: () => {
    return get().status === 'trialing';
  },
}));
