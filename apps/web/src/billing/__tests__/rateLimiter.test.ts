import { describe, it, expect } from 'vitest';
import { SlidingWindowRateLimiter } from '../../../../../supabase/functions/_shared/rateLimiter';

describe('per-minute rate limiter (ai-gateway)', () => {
  it('allows requests up to the limit within a window', () => {
    const limiter = new SlidingWindowRateLimiter(3, 60_000);
    const now = 1_000_000;
    expect(limiter.allow('u1', now)).toBe(true);
    expect(limiter.allow('u1', now + 1)).toBe(true);
    expect(limiter.allow('u1', now + 2)).toBe(true);
    expect(limiter.allow('u1', now + 3)).toBe(false);
  });

  it('resets after the window expires', () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    const now = 1_000_000;
    expect(limiter.allow('u1', now)).toBe(true);
    expect(limiter.allow('u1', now + 1)).toBe(false);
    expect(limiter.allow('u1', now + 60_001)).toBe(true);
  });

  it('tracks users independently', () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    const now = 1_000_000;
    expect(limiter.allow('u1', now)).toBe(true);
    expect(limiter.allow('u1', now + 1)).toBe(false);
    expect(limiter.allow('u2', now + 1)).toBe(true);
  });
});
