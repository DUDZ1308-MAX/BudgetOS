import { useSubscriptionStore } from '@/stores/subscription';
import {
  getCachedSubscription,
  setCachedSubscription,
  clearCachedSubscription,
  isCacheExpired,
  defaultSubscription,
} from './subscriptionCache';
import { hasStripeConfig } from '@/billing/stripe/stripeConfig';

export class SubscriptionSync {
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  init(): void {
    const cached = getCachedSubscription();

    if (cached && !isCacheExpired(cached)) {
      useSubscriptionStore.getState().setSubscription({
        tier: cached.tier,
        interval: cached.interval,
        status: cached.status,
        currentPeriodEnd: cached.currentPeriodEnd,
        trialEnd: cached.trialEnd,
        cancelAtPeriodEnd: cached.cancelAtPeriodEnd,
        stripeCustomerId: cached.stripeCustomerId,
      });
    } else if (cached && isCacheExpired(cached)) {
      this.syncFromServer().catch(() => {
        useSubscriptionStore.getState().setSubscription(defaultSubscription());
      });
    } else {
      useSubscriptionStore.getState().setSubscription(defaultSubscription());
    }

    useSubscriptionStore.getState().setInitialized(true);
    this.startPeriodicSync();
  }

  async syncFromServer(): Promise<void> {
    if (!hasStripeConfig()) return;

    try {
      const response = await fetch('/api/stripe/subscription', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();

      const sub = {
        tier: data.tier ?? 'free',
        interval: data.interval ?? 'month',
        status: data.status ?? 'active',
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        trialEnd: data.trialEnd ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        stripeCustomerId: data.stripeCustomerId ?? null,
      };

      useSubscriptionStore.getState().setSubscription(sub);
      setCachedSubscription(sub);
    } catch {
      const cached = getCachedSubscription();
      if (cached) {
        useSubscriptionStore.getState().setSubscription({
          tier: cached.tier,
          interval: cached.interval,
          status: cached.status,
          currentPeriodEnd: cached.currentPeriodEnd,
          trialEnd: cached.trialEnd,
          cancelAtPeriodEnd: cached.cancelAtPeriodEnd,
          stripeCustomerId: cached.stripeCustomerId,
        });
      }
      throw new Error('Failed to sync subscription from server');
    }
  }

  clearSync(): void {
    clearCachedSubscription();
    useSubscriptionStore.getState().setSubscription(defaultSubscription());
  }

  private startPeriodicSync(): void {
    this.stopPeriodicSync();
    this.syncIntervalId = setInterval(() => {
      this.syncFromServer().catch(() => {
        // silent fail — cache or default is used
      });
    }, 5 * 60 * 1000);
  }

  stopPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}

export const subscriptionSync = new SubscriptionSync();
