import { create } from 'zustand';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import { getPlan } from '@/billing/pricingPlans';

const STORAGE_KEY = 'budgetos_subscription';

export interface SubscriptionState {
  tier: SubscriptionTier;
  interval: BillingInterval;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  initialized: boolean;
  isLoading: boolean;

  setTier: (tier: SubscriptionTier) => void;
  setInterval: (interval: BillingInterval) => void;
  setSubscription: (data: Partial<SubscriptionState>) => void;
  startTrial: (tier: SubscriptionTier, days: number) => void;
  markCancelAtPeriodEnd: () => void;
  setInitialized: (val: boolean) => void;
  refresh: () => Promise<void>;
  load: () => void;
  reset: () => void;
  isActive: () => boolean;
  isOnTrial: () => boolean;
  save: () => void;
}

function defaultState() {
  return {
    tier: 'free' as SubscriptionTier,
    interval: 'month' as BillingInterval,
    status: 'active' as const,
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

  setTier: (tier) => {
    set({ tier });
    get().save();
  },

  setInterval: (interval) => {
    set({ interval });
    get().save();
  },

  setSubscription: (data) => {
    set({ ...data });
    get().save();
  },

  startTrial: (tier, days) => {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    set({
      tier,
      status: 'trialing',
      trialEnd: trialEnd.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
    });
    get().save();
  },

  markCancelAtPeriodEnd: () => {
    set({ cancelAtPeriodEnd: true });
    get().save();
  },

  isActive: () => {
    const state = get();
    return state.status === 'active' || state.status === 'trialing';
  },

  isOnTrial: () => {
    return get().status === 'trialing';
  },

  setInitialized: (val) => set({ initialized: val }),

  refresh: async () => {
    set({ isLoading: true });
    try {
      const saved = getStored();
      if (saved) {
        set({ ...saved, initialized: true, isLoading: false });
      } else {
        set({ initialized: true, isLoading: false });
      }
    } catch {
      set({ initialized: true, isLoading: false });
    }
  },

  load: () => {
    try {
      const saved = getStored();
      if (saved) {
        set({ ...saved, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ ...defaultState(), initialized: true });
  },

  save: () => {
    try {
      const { initialized, isLoading, ...data } = get();
      const storeData: StoredData = {
        tier: data.tier,
        interval: data.interval,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        trialEnd: data.trialEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        stripeCustomerId: data.stripeCustomerId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } catch {
      // ignore
    }
  },
}));

interface StoredData {
  tier: SubscriptionTier;
  interval: BillingInterval;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

function getStored(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}
