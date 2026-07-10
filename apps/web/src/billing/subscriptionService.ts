import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { useAuthStore } from '@/stores/auth';
import { createCheckoutSession } from '@/billing/stripe/stripeCheckout';
import { createPortalSession } from '@/billing/stripe/stripePortal';
import { subscriptionSync } from '@/billing/subscription/subscriptionSync';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import type { CheckoutResult, PortalResult } from '@/billing/stripe/stripeTypes';
import { getPlan } from '@/billing/pricingPlans';
import { canProcessPayments, requireStripeLive, getStripeMode } from '@/billing/stripe/stripeSafety';
import { logger } from '@/core/logger';

export class SubscriptionService {
  static init(): void {
    subscriptionSync.init();
    const user = useAuthStore.getState().user;
    if (user) {
      useUsageStore.getState().setUserId(user.id);
    }
  }

  static onUserChange(userId: string | null): void {
    useUsageStore.getState().setUserId(userId);
    if (userId) {
      subscriptionSync.syncFromServer().catch(() => {});
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
      logger.warn('Payment processing blocked', 'SubscriptionService', { reason: safety.reason });
      return { success: false, error: safety.reason ?? 'Payment processing is not available.' };
    }

    requireStripeLive();

    const { stripeCustomerId } = useSubscriptionStore.getState();
    const result = await createCheckoutSession(stripeCustomerId, tier, interval);

    if (result.success) {
      if (result.url && !result.url.startsWith('?')) {
        window.location.href = result.url;
      } else {
        useSubscriptionStore.getState().startTrial(tier, 14);
      }
    }

    return result;
  }

  static async manageSubscription(): Promise<PortalResult> {
    const safety = canProcessPayments();
    if (!safety.allowed) {
      return { success: false, error: safety.reason ?? 'Payment processing is not available.' };
    }

    const { stripeCustomerId } = useSubscriptionStore.getState();

    if (!stripeCustomerId) {
      return { success: false, error: 'No active subscription to manage.' };
    }

    const result = await createPortalSession(stripeCustomerId);

    if (result.success && result.url) {
      window.location.href = result.url;
    }

    return result;
  }

  static cancelSubscription(): void {
    useSubscriptionStore.getState().markCancelAtPeriodEnd();
  }

  static async downgradeToFree(): Promise<void> {
    useSubscriptionStore.getState().reset();
    subscriptionSync.clearSync();
  }

  static refreshFromServer(): Promise<void> {
    return subscriptionSync.syncFromServer();
  }

  static getPlanName(tier: SubscriptionTier): string {
    return getPlan(tier).name;
  }

  static getPlanPrice(tier: SubscriptionTier, interval: BillingInterval): number {
    const plan = getPlan(tier);
    return interval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;
  }
}
