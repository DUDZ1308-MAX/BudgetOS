import { describe, it, expect } from 'vitest';
import {
  hasActiveSubscription,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from '../../../../../supabase/functions/_shared/subscriptionGate';

describe('subscription gate (double-billing protection)', () => {
  it('allows a free user (no subscription row) to start checkout', () => {
    expect(hasActiveSubscription(null)).toBe(false);
    expect(hasActiveSubscription(undefined)).toBe(false);
  });

  it('allows a free user who only has a stored customer reference', () => {
    expect(
      hasActiveSubscription({
        stripe_subscription_id: null,
        stripe_customer_id: 'cus_test',
        status: 'active',
      }),
    ).toBe(false);
  });

  it('blocks an existing active subscriber from a second subscription', () => {
    expect(
      hasActiveSubscription({
        stripe_subscription_id: 'sub_active',
        stripe_customer_id: 'cus_test',
        status: 'active',
      }),
    ).toBe(true);
  });

  it.each(['trialing', 'past_due', 'incomplete'])(
    'blocks an existing subscriber whose status is %s',
    (status) => {
      expect(
        hasActiveSubscription({
          stripe_subscription_id: 'sub_1',
          stripe_customer_id: 'cus_test',
          status,
        }),
      ).toBe(true);
    },
  );

  it('allows re-subscribing after cancellation', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete_expired']) {
      expect(
        hasActiveSubscription({
          stripe_subscription_id: 'sub_old',
          stripe_customer_id: 'cus_test',
          status,
        }),
      ).toBe(false);
    }
  });

  it('defines the billable status set explicitly', () => {
    expect(ACTIVE_SUBSCRIPTION_STATUSES).toEqual(
      new Set(['active', 'trialing', 'past_due', 'incomplete']),
    );
  });
});
