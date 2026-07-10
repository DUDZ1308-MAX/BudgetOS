import { useSubscriptionStore } from '@/stores/subscription';
import { getPlan } from '@/billing/pricingPlans';

export function useSubscription() {
  const store = useSubscriptionStore();

  const plan = getPlan(store.tier);
  const isFree = store.tier === 'free';
  const isPro = store.tier === 'pro';
  const isPremium = store.tier === 'premium';
  const isPaid = isPro || isPremium;
  const isActive = store.status === 'active' || store.status === 'trialing';
  const isOnTrial = store.status === 'trialing';
  const isCanceled = store.cancelAtPeriodEnd;
  const priceDisplay = store.interval === 'month'
    ? `$${plan.monthlyPrice}/mo`
    : `$${plan.yearlyPrice}/yr`;

  return {
    tier: store.tier,
    status: store.status,
    interval: store.interval,
    plan,
    isFree,
    isPro,
    isPremium,
    isPaid,
    isActive,
    isOnTrial,
    isCanceled,
    cancelAtPeriodEnd: store.cancelAtPeriodEnd,
    currentPeriodEnd: store.currentPeriodEnd,
    trialEnd: store.trialEnd,
    stripeCustomerId: store.stripeCustomerId,
    initialized: store.initialized,
    priceDisplay,
    isLoading: store.isLoading,
  };
}
