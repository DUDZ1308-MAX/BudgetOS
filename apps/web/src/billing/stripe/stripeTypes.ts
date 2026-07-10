import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';

export type StripeSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface StripeSubscriptionData {
  id: string;
  customerId: string;
  status: StripeSubscriptionStatus;
  tier: SubscriptionTier;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  created: string;
  updatedAt: string;
}

export interface CheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export interface PortalResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PriceConfig {
  month: string;
  year: string;
}

export interface StripeConfig {
  publishableKey: string;
  priceIds: Record<SubscriptionTier, PriceConfig>;
  getCheckoutUrl: string;
  getPortalUrl: string;
  webhookEndpoint: string;
  successUrl: string;
  cancelUrl: string;
}
