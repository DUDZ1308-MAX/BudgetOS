import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/stores/subscription';
import type { SubscriptionStatus } from '@/stores/subscription';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

interface ServerSubscription {
  tier?: string;
  interval?: string;
  status?: string;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string | null;
}

function freeState() {
  return {
    tier: 'free' as const,
    interval: 'month' as const,
    status: 'active' as const,
    currentPeriodEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
  };
}

export class SubscriptionSync {
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private enabled = false;

  init(): void {
    useSubscriptionStore.getState().setInitialized(true);
    this.startPeriodicSync();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
  }

  async syncFromServer(): Promise<void> {
    useSubscriptionStore.getState().setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<ServerSubscription>(
        'stripe-get-subscription',
      );

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error('Empty subscription response');
      }

      const sub = {
        tier: (data.tier ?? 'free') as SubscriptionTier,
        interval: (data.interval ?? 'month') as BillingInterval,
        status: (data.status ?? 'active') as SubscriptionStatus,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        trialEnd: data.trialEnd ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        stripeCustomerId: data.stripeCustomerId ?? null,
      };

      useSubscriptionStore.getState().setSubscription(sub);
    } catch {
      // Fail safely to FREE. A failed lookup must never leave a user
      // with an unverified paid tier.
      useSubscriptionStore.getState().setSubscription(freeState());
      throw new Error('Failed to sync subscription from server');
    } finally {
      useSubscriptionStore.getState().setLoading(false);
    }
  }

  private startPeriodicSync(): void {
    this.stopPeriodicSync();
    if (!this.enabled) return;
    this.syncIntervalId = setInterval(() => {
      this.syncFromServer().catch(() => {
        // silent fail — the store was already reset to FREE by the
        // sync failure path.
      });
    }, SYNC_INTERVAL_MS);
  }

  stopPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}

export const subscriptionSync = new SubscriptionSync();
