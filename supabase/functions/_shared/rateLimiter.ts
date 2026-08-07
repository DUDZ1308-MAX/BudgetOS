// Faithful extraction of ai-gateway's per-user per-minute sliding-window
// rate limiter so it can be unit tested in the web test suite.

export class SlidingWindowRateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true when a request for `key` is allowed in this window. */
  allow(key: string, now: number = Date.now()): boolean {
    const entry = this.entries.get(key);
    if (!entry || now > entry.resetAt) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.limit) return false;
    entry.count += 1;
    return true;
  }
}
