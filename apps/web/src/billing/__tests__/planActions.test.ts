import { describe, it, expect } from 'vitest';
import { resolvePlanAction } from '../planActions';
import { PLANS } from '../pricingPlans';
import type { PricingPlan, SubscriptionTier } from '../pricingPlans';

function plan(id: PricingPlan['id']): PricingPlan {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error(`missing plan ${id}`);
  return p;
}

describe('plan action routing', () => {
  it('routes current plan clicks to /billing', () => {
    expect(resolvePlanAction('free', plan('free'))).toBe('current');
    expect(resolvePlanAction('pro', plan('pro'))).toBe('current');
    expect(resolvePlanAction('premium', plan('premium'))).toBe('current');
  });

  it('sends free-tier users to Checkout for a paid plan', () => {
    expect(resolvePlanAction('free', plan('pro'))).toBe('checkout');
    expect(resolvePlanAction('free', plan('premium'))).toBe('checkout');
  });

  it('sends paid users to the Customer Portal for any downgrade', () => {
    expect(resolvePlanAction('pro', plan('free'))).toBe('portal');
    expect(resolvePlanAction('premium', plan('free'))).toBe('portal');
  });

  it('sends paid users to the Customer Portal for plan switches', () => {
    expect(resolvePlanAction('pro', plan('premium'))).toBe('portal');
    expect(resolvePlanAction('premium', plan('pro'))).toBe('portal');
  });

  it('never fabricates a local downgrade (free->free is a no-op)', () => {
    expect(resolvePlanAction('free' as SubscriptionTier, plan('free'))).not.toBe('portal');
  });
});
