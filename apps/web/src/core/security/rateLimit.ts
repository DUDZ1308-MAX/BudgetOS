const rateLimits = new Map<string, number>();

/**
 * Check if an action has been performed too recently.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function checkRateLimit(action: string, minIntervalMs: number = 1000): boolean {
  const now = Date.now();
  const lastTime = rateLimits.get(action);
  if (lastTime && now - lastTime < minIntervalMs) {
    return false;
  }
  rateLimits.set(action, now);
  return true;
}

/**
 * Clear all rate limits.
 */
export function clearRateLimits(): void {
  rateLimits.clear();
}
