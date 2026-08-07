import { describe, it, expect } from 'vitest';
import { PLANS, getPlan, getAiRequestLimit, getMaxTransactions, getMaxAccounts, getMaxSavingsGoals } from '../pricingPlans';

describe('pricingPlans', () => {
  it('preserves the approved pricing', () => {
    const pro = getPlan('pro');
    const premium = getPlan('premium');

    expect(pro.monthlyPrice).toBe(9);
    expect(pro.yearlyPrice).toBe(90);
    expect(premium.monthlyPrice).toBe(19);
    expect(premium.yearlyPrice).toBe(190);
  });

  it('offers a 14-day trial on paid plans only', () => {
    expect(getPlan('free').trialDays).toBe(0);
    expect(getPlan('pro').trialDays).toBe(14);
    expect(getPlan('premium').trialDays).toBe(14);
  });

  it('has the expected plan ids', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['free', 'pro', 'premium']);
  });

  it('returns the free plan for unknown tiers', () => {
    expect(getPlan('free').id).toBe('free');
  });

  it('limits free tier counts', () => {
    expect(getMaxTransactions('free')).toBe(50);
    expect(getMaxAccounts('free')).toBe(2);
    expect(getMaxSavingsGoals('free')).toBe(1);
    expect(getMaxTransactions('pro')).toBeNull();
  });

  it('gates AI limits per tier', () => {
    expect(getAiRequestLimit('free')).toBe(5);
    expect(getAiRequestLimit('pro')).toBe(200);
    expect(getAiRequestLimit('premium')).toBe(1000);
  });
});
