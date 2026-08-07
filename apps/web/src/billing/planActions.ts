import type { PricingPlan, SubscriptionTier } from '@/billing/pricingPlans';

export type PlanAction = 'current' | 'checkout' | 'portal' | 'none';

/**
 * Decides what clicking a plan card should do. Never fabricates a local
 * downgrade: Stripe remains authoritative.
 *  - current plan            -> go to /billing
 *  - free tier, paid target  -> new Checkout subscription
 *  - paid tier, any target   -> Stripe Customer Portal (plan changes and
 *                               cancellations happen there; entitlement
 *                               stays active until the period ends)
 *  - free tier, free target  -> nothing
 */
export function resolvePlanAction(
  currentTier: SubscriptionTier,
  target: PricingPlan,
): PlanAction {
  if (target.id === currentTier) return 'current';
  if (target.id === 'free') return currentTier === 'free' ? 'none' : 'portal';
  return currentTier === 'free' ? 'checkout' : 'portal';
}
