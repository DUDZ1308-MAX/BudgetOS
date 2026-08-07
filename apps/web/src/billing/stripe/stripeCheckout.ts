import { supabase } from '@/lib/supabase';
import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import type { CheckoutResult } from '@/billing/stripe/stripeTypes';

interface CheckoutResponse {
  url?: string;
  portalUrl?: string;
  alreadySubscribed?: boolean;
  error?: string;
}

export async function createCheckoutSession(
  tier: SubscriptionTier,
  interval: BillingInterval,
): Promise<CheckoutResult> {
  try {
    const { data, error } = await supabase.functions.invoke<CheckoutResponse>(
      'stripe-create-checkout-session',
      { body: { tier, interval } },
    );

    if (error) {
      return { success: false, error: error.message };
    }

    // Existing subscribers are routed to the Customer Portal by the
    // server so a second subscription can never be created.
    if (data?.alreadySubscribed) {
      return {
        success: false,
        alreadySubscribed: true,
        portalUrl: data.portalUrl,
        error: data.error ?? 'You already have an active subscription.',
      };
    }

    if (!data?.url) {
      return { success: false, error: 'Checkout could not be started. Please try again.' };
    }

    return { success: true, url: data.url as string };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Checkout failed' };
  }
}
