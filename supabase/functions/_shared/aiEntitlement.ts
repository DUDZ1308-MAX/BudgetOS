// Server-side AI entitlement policy for the ai-gateway Edge Function.
// Pure module (no Deno/Stripe imports) so the web test suite can test
// the policy directly.
//
// The authoritative check-and-increment happens in the database RPC
// consume_ai_usage() (migration 018); this module supplies the
// fail-closed tier -> limit mapping and the request decision used by
// the gateway. Client-provided tiers and usage values are never read.

/** Mirrors apps/web/src/billing/planMatrix.ts (feature 'ai_copilot'). */
export const AI_LIMITS_BY_TIER: Record<string, number> = {
  free: 5,
  pro: 200,
  premium: 1000,
};

/** Fail-closed: an unknown/unreadable tier is treated as FREE. */
export const FAIL_CLOSED_AI_TIER = "free";
export const FAIL_CLOSED_AI_LIMIT = AI_LIMITS_BY_TIER[FAIL_CLOSED_AI_TIER]!;

export function aiLimitForTier(tier: string | null | undefined): number {
  if (!tier) return FAIL_CLOSED_AI_LIMIT;
  return AI_LIMITS_BY_TIER[tier] ?? FAIL_CLOSED_AI_LIMIT;
}

export function usageMonth(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  return `${date.getFullYear()}-${String(month).padStart(2, "0")}`;
}

export type AiRequestDecision =
  | { action: "allow" }
  | { action: "deny-limit"; requestCount: number; requestLimit: number; tier: string }
  | { action: "deny-error" };

/** Shape of the consume_ai_usage() RPC result row. */
export interface ConsumeUsageResult {
  allowed?: boolean;
  request_count?: number | null;
  request_limit?: number | null;
  tier?: string | null;
}

/**
 * Fail-closed interpretation of the consume_ai_usage() RPC:
 *  - RPC error / missing result -> deny (never bypass the limit)
 *  - allowed === false          -> deny with limit messaging
 *  - otherwise                  -> allow
 */
export function decideAiRequest(
  result: ConsumeUsageResult | null,
  rpcError: boolean,
): AiRequestDecision {
  if (rpcError || !result) return { action: "deny-error" };
  if (result.allowed !== true) {
    return {
      action: "deny-limit",
      requestCount: result.request_count ?? 0,
      requestLimit: result.request_limit ?? FAIL_CLOSED_AI_LIMIT,
      tier: result.tier ?? FAIL_CLOSED_AI_TIER,
    };
  }
  return { action: "allow" };
}
