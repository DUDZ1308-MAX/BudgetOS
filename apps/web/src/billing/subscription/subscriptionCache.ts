import type { SubscriptionTier, BillingInterval } from '@/billing/pricingPlans';
import type { StripeSubscriptionStatus } from '@/billing/stripe/stripeTypes';

const STORAGE_KEY = 'budgetos_subscription';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface CachedSubscription {
  tier: SubscriptionTier;
  interval: BillingInterval;
  status: StripeSubscriptionStatus;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  cachedAt: number;
}

export function getCachedSubscription(): CachedSubscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSubscription;
  } catch {
    return null;
  }
}

export function setCachedSubscription(data: Omit<CachedSubscription, 'cachedAt'>): void {
  try {
    const cache: CachedSubscription = { ...data, cachedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded or storage disabled
  }
}

export function clearCachedSubscription(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isCacheValid(cached: CachedSubscription | null): boolean {
  if (!cached) return false;
  return Date.now() - cached.cachedAt < CACHE_TTL_MS;
}

export function isCacheExpired(cached: CachedSubscription | null): boolean {
  return !isCacheValid(cached);
}

export function defaultSubscription(): Omit<CachedSubscription, 'cachedAt'> {
  return {
    tier: 'free',
    interval: 'month',
    status: 'active',
    currentPeriodEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
  };
}
