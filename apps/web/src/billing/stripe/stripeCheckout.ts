import { STRIPE_CONFIG } from './stripeConfig';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import type { CheckoutResult } from './stripeTypes';

export async function createCheckoutSession(
  customerId: string | null,
  tier: SubscriptionTier,
  interval: BillingInterval,
): Promise<CheckoutResult> {
  if (tier === 'free') {
    return { success: false, error: 'Free plan does not require checkout.' };
  }

  const priceId = interval === 'month'
    ? STRIPE_CONFIG.priceIds[tier]?.month
    : STRIPE_CONFIG.priceIds[tier]?.year;

  if (!STRIPE_CONFIG.publishableKey) {
    return simulateCheckout(tier, interval);
  }

  try {
    const response = await fetch(STRIPE_CONFIG.getCheckoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        customerId,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
        trialDays: tier === 'pro' || tier === 'premium' ? 14 : 0,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { success: false, error: body.error ?? `Checkout failed (${response.status})` };
    }

    const data = await response.json();
    return { success: true, url: data.url, sessionId: data.sessionId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during checkout',
    };
  }
}

async function simulateCheckout(tier: SubscriptionTier, _interval: BillingInterval): Promise<CheckoutResult> {
  await new Promise((r) => setTimeout(r, 500));

  return {
    success: true,
    sessionId: `cs_sim_${Date.now()}`,
    url: `?checkout=sim&tier=${tier}`,
  };
}
