import { describe, it, expect } from 'vitest';
import { detectIntent, tiersForIntent, intentLabel } from '../intent';
import type { CoachIntent } from '../types';

describe('intent detection (Phase 8)', () => {
  const cases: Array<[string, CoachIntent]> = [
    ['What did I spend on groceries this month?', 'spending_analysis'],
    ['Am I over budget in any categories?', 'budget_analysis'],
    ['What does my monthly cash flow look like?', 'cash_flow'],
    ['What will my balance be in 60 days?', 'forecast'],
    ['How much interest have I saved on my mortgage?', 'mortgage'],
    ['How much do I need to save for a car?', 'savings'],
    ['Am I on track for retirement?', 'retirement'],
    ['How is my overall financial health?', 'financial_health'],
    ['What if I pay $200 extra on my mortgage?', 'what_if_scenario'],
    ['Tell me something interesting about money', 'general_finance'],
  ];

  it.each(cases)('detects "%s" as %s', (message, expected) => {
    expect(detectIntent(message)).toBe(expected);
  });

  it('detects what-if scenarios before generic fallbacks', () => {
    expect(detectIntent('What if I save an extra $100 a month?')).toBe('what_if_scenario');
    expect(detectIntent('what if i reduce spending by $50?')).toBe('what_if_scenario');
  });

  it('falls back to general finance for empty/unknown input', () => {
    expect(detectIntent('')).toBe('general_finance');
    expect(detectIntent('hello there')).toBe('general_finance');
  });

  it('maps intents to their required context tiers', () => {
    expect(tiersForIntent('forecast')).toContain('basic');
    expect(tiersForIntent('forecast')).toContain('forecast');
    expect(tiersForIntent('spending_analysis')).toContain('spending');
    expect(tiersForIntent('budget_analysis')).toContain('budget');
    expect(tiersForIntent('mortgage')).toContain('debt');
    expect(tiersForIntent('savings')).toContain('goal');
    expect(tiersForIntent('financial_health')).toContain('health');
  });

  it('labels intents for display', () => {
    expect(intentLabel('forecast')).toBeTruthy();
    expect(intentLabel('what_if_scenario')).toContain('scenario');
    expect(intentLabel('financial_health')).toBe('financial health');
  });
});
