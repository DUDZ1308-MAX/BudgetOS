import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { useAuthStore } from '@/stores/auth';
import { createCheckoutSession } from '@/billing/stripe/stripeCheckout';
import { createPortalSession } from '@/billing/stripe/stripePortal';
import { subscriptionSync } from '@/billing/subscription/subscriptionSync';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import type { CheckoutResult, PortalResult } from '@/billing/stripe/stripeTypes';
import { getPlan } from '@/billing/pricingPlans';
import { canProcessPayments, requireStripeLive } from '@/billing/stripe/stripeSafety';
import { logger } from '@/core/logger';

export class SubscriptionService {
  static init(): void {
    const user = useAuthStore.getState().user;
    if (user) {
      useUsageStore.getState().setUserId(user.id);
    }
    subscriptionSync.init();
    subscriptionSync.setEnabled(!!user);

    // Keep the store in sync with authentication changes.
    useAuthStore.subscribe((state, prevState) => {
      if (state.user?.id !== prevState.user?.id) {
        this.onUserChange(state.user?.id ?? null);
      }
    });
  }

  static onUserChange(userId: string | null): void {
    useUsageStore.getState().setUserId(userId);
    if (userId) {
      subscriptionSync.setEnabled(true);
      subscriptionSync.syncFromServer().catch(() => {});
    } else {
      subscriptionSync.setEnabled(false);
      useSubscriptionStore.getState().reset();
    }
  }

  static async upgrade(
    tier: SubscriptionTier,
    interval: BillingInterval = 'month',
  ): Promise<CheckoutResult> {
    if (tier === 'free') {
      return { success: false, error: 'Already on the Free plan.' };
    }

    const safety = canProcessPayments();
    if (!safety.allowed) {
      logger.warn('Payment processing blocked', 'SubscriptionService', {
        reason: safety.reason,
        devHint: safety.devHint,
      });
      return { success: false, error: safety.reason ?? 'Payment processing is not available.' };
    }

    requireStripeLive();

    // Stripe grants the trial and the webhook confirms entitlement. The
    // frontend never fabricates a trial locally.
    const result = await createCheckoutSession(tier, interval);

    // Server-side protection: an existing subscriber is never allowed a
    // second subscription; they are directed to the Customer Portal.
    if (result.alreadySubscribed && result.portalUrl) {
      window.location.href = result.portalUrl;
      return result;
    }

    if (result.success && result.url) {
      window.location.href = result.url;
    }

    return result;
  }

  static async manageSubscription(): Promise<PortalResult> {
    const safety = canProcessPayments();
    if (!safety.allowed) {
      return { success: false, error: safety.reason ?? 'Payment processing is not available.' };
    }

    const result = await createPortalSession();

    if (result.success && result.url) {
      window.location.href = result.url;
    }

    return result;
  }

  static async refreshFromServer(): Promise<void> {
    await subscriptionSync.syncFromServer();
  }

  static getPlanName(tier: SubscriptionTier): string {
    return getPlan(tier).name;
  }

  static getPlanPrice(tier: SubscriptionTier, interval: BillingInterval): number {
    const plan = getPlan(tier);
    return interval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;
  }
}
