import { describe, it, expect } from 'vitest';
import {
  aiLimitForTier,
  decideAiRequest,
  usageMonth,
  AI_LIMITS_BY_TIER,
  FAIL_CLOSED_AI_TIER,
  FAIL_CLOSED_AI_LIMIT,
} from '../../../../../supabase/functions/_shared/aiEntitlement';

describe('AI tier limits (server-side, mirrors planMatrix ai_copilot)', () => {
  it('preserves the existing FREE/PRO/PREMIUM monthly limits', () => {
    expect(aiLimitForTier('free')).toBe(5);
    expect(aiLimitForTier('pro')).toBe(200);
    expect(aiLimitForTier('premium')).toBe(1000);
  });

  it('keeps planMatrix.ts and the server policy in lockstep', () => {
    expect(AI_LIMITS_BY_TIER.free).toBe(5);
    expect(AI_LIMITS_BY_TIER.pro).toBe(200);
    expect(AI_LIMITS_BY_TIER.premium).toBe(1000);
  });

  it('fails closed to the FREE limit for a fake/unknown tier', () => {
    expect(aiLimitForTier('hacker')).toBe(FAIL_CLOSED_AI_LIMIT);
    expect(aiLimitForTier('')).toBe(FAIL_CLOSED_AI_LIMIT);
    expect(aiLimitForTier(null)).toBe(FAIL_CLOSED_AI_LIMIT);
    expect(aiLimitForTier(undefined)).toBe(FAIL_CLOSED_AI_LIMIT);
    expect(FAIL_CLOSED_AI_TIER).toBe('free');
  });

  it('formats the usage month as YYYY-MM', () => {
    expect(usageMonth(new Date(2026, 0, 15))).toBe('2026-01');
    expect(usageMonth(new Date(2026, 11, 31))).toBe('2026-12');
  });
});

describe('AI request decision (fail-closed)', () => {
  it('denies when the usage RPC errors', () => {
    expect(decideAiRequest(null, true)).toEqual({ action: 'deny-error' });
    expect(decideAiRequest({ allowed: true, request_count: 1 }, true)).toEqual({
      action: 'deny-error',
    });
  });

  it('denies when the usage RPC returns nothing', () => {
    expect(decideAiRequest(null, false)).toEqual({ action: 'deny-error' });
  });

  it('denies at the FREE limit', () => {
    const decision = decideAiRequest(
      { allowed: false, request_count: 5, request_limit: 5, tier: 'free' },
      false,
    );
    expect(decision.action).toBe('deny-limit');
    if (decision.action === 'deny-limit') {
      expect(decision.requestLimit).toBe(5);
      expect(decision.tier).toBe('free');
    }
  });

  it('denies at the PRO and PREMIUM limits', () => {
    for (const [tier, limit] of [
      ['pro', 200],
      ['premium', 1000],
    ] as const) {
      const decision = decideAiRequest(
        { allowed: false, request_count: limit, request_limit: limit, tier },
        false,
      );
      expect(decision.action).toBe('deny-limit');
      if (decision.action === 'deny-limit') {
        expect(decision.requestLimit).toBe(limit);
      }
    }
  });

  it('allows within the limit', () => {
    expect(
      decideAiRequest({ allowed: true, request_count: 4, request_limit: 5, tier: 'free' }, false),
    ).toEqual({ action: 'allow' });
  });

  it('ignores client-provided usage values (only RPC fields are read)', () => {
    const forged = {
      allowed: true,
      request_count: 1_000_000,
      request_limit: 999_999,
      tier: 'premium',
      clientTier: 'premium',
      clientUsage: 0,
    } as unknown as Parameters<typeof decideAiRequest>[0];
    const decision = decideAiRequest(forged, false);
    expect(decision.action).toBe('allow');
  });
});
