import { describe, it, expect } from 'vitest';
import {
  hasFeatureAccess,
  getFeatureLimit,
  getMinimumTier,
  getTierUpgradeTarget,
  isTierAtLeast,
  getAllLimits,
} from '../planMatrix';

describe('planMatrix', () => {
  it('grants paid-only features only to paid tiers', () => {
    expect(hasFeatureAccess('free', 'export_csv')).toBe(false);
    expect(hasFeatureAccess('pro', 'export_csv')).toBe(true);
    expect(hasFeatureAccess('premium', 'export_csv')).toBe(true);
  });

  it('reserves premium-only features for premium', () => {
    expect(hasFeatureAccess('pro', 'priority_ai')).toBe(false);
    expect(hasFeatureAccess('premium', 'priority_ai')).toBe(true);
  });

  it('computes the minimum tier to unlock a feature', () => {
    expect(getMinimumTier('export_csv')).toBe('pro');
    expect(getMinimumTier('priority_ai')).toBe('premium');
    expect(getMinimumTier('budgets')).toBe('free');
  });

  it('returns an upgrade target only when the current tier lacks access', () => {
    expect(getTierUpgradeTarget('free', 'ai_copilot')).toBeNull(); // free has limited access
    expect(getTierUpgradeTarget('pro', 'priority_ai')).toBe('premium');
    expect(getTierUpgradeTarget('premium', 'priority_ai')).toBeNull();
  });

  it('orders tiers by rank', () => {
    expect(isTierAtLeast('premium', 'pro')).toBe(true);
    expect(isTierAtLeast('free', 'pro')).toBe(false);
  });

  it('applies per-tier usage limits', () => {
    expect(getFeatureLimit('free', 'ai_copilot')).toBe(5);
    expect(getFeatureLimit('pro', 'ai_copilot')).toBe(200);
    expect(getFeatureLimit('premium', 'ai_copilot')).toBe(1000);
    expect(getFeatureLimit('free', 'transactions')).toBe(50);
    expect(getFeatureLimit('pro', 'transactions')).toBeUndefined();
  });

  it('never grants a limit for an unavailable feature', () => {
    const freeLimits = getAllLimits('free');
    expect(freeLimits.export_csv).toBeUndefined();
  });
});
