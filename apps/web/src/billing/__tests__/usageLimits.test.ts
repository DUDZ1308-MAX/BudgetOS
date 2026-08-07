import { describe, it, expect } from 'vitest';
import { checkAILimit, checkFeatureLimit, getRemaining } from '../usage/usageLimits';

describe('usageLimits', () => {
  it('allows AI usage within the free limit', () => {
    expect(checkAILimit('free', 0).allowed).toBe(true);
    expect(checkAILimit('free', 4).allowed).toBe(true);
  });

  it('blocks AI usage at the free limit and suggests an upgrade', () => {
    const result = checkAILimit('free', 5);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(5);
    expect(result.current).toBe(5);
    expect(result.upgradeTier).toBe('pro');
  });

  it('blocks unavailable features entirely', () => {
    const result = checkFeatureLimit('free', 'export_csv', 0);
    expect(result.allowed).toBe(false);
  });

  it('grants higher limits to paid tiers', () => {
    expect(checkAILimit('pro', 199).allowed).toBe(true);
    expect(checkAILimit('pro', 200).allowed).toBe(false);
    expect(checkAILimit('premium', 999).allowed).toBe(true);
  });

  it('computes remaining usage', () => {
    expect(getRemaining('free', 'ai_copilot', 2)).toBe(3);
    expect(getRemaining('pro', 'transactions', 5)).toBe(Infinity);
  });

  it('never allows an unauthorized tier to bypass gates', () => {
    expect(checkAILimit('free', 9999).allowed).toBe(false);
  });
});
