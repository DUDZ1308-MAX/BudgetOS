import { describe, it, expect, beforeEach } from 'vitest';
import { useSubscriptionStore } from '@/stores/subscription';

describe('subscription store', () => {
  beforeEach(() => {
    useSubscriptionStore.getState().reset();
  });

  it('defaults to free', () => {
    const state = useSubscriptionStore.getState();
    expect(state.tier).toBe('free');
    expect(state.status).toBe('active');
    expect(state.interval).toBe('month');
    expect(state.stripeCustomerId).toBeNull();
  });

  it('reset can never grant a paid tier', () => {
    useSubscriptionStore.getState().setSubscription({ tier: 'pro', status: 'active' });
    useSubscriptionStore.getState().reset();
    expect(useSubscriptionStore.getState().tier).toBe('free');
  });

  it('populates from server-verified data', () => {
    useSubscriptionStore.getState().setSubscription({
      tier: 'pro',
      interval: 'year',
      status: 'trialing',
      trialEnd: '2030-01-01T00:00:00.000Z',
      stripeCustomerId: 'cus_test',
    });
    const state = useSubscriptionStore.getState();
    expect(state.tier).toBe('pro');
    expect(state.isOnTrial()).toBe(true);
    expect(state.isActive()).toBe(true);
  });

  it('treats canceled as inactive', () => {
    useSubscriptionStore.getState().setSubscription({ tier: 'pro', status: 'canceled' });
    expect(useSubscriptionStore.getState().isActive()).toBe(false);
  });
});
