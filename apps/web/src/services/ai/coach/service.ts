import { requireUserId } from '@/lib/auth';
import { buildFinancialSnapshot } from './snapshot';
import { detectIntent } from './intent';
import { buildCoachContext } from './context';
import { parseScenario, runCoachScenario } from './scenarios';
import { buildProactiveInsights } from './insights';
import type { CoachInsight, CoachRequest } from './types';

// ============================================================================
// AI Financial Coach — request orchestration (Phase 9)
//
// Deterministic pipeline: detect intent -> build authoritative snapshot ->
// parse what-if (if any) -> run scenario through the Financial Engine ->
// assemble the tiered context. The AI provider then only formats an answer
// from the resulting prompt. No financial value is computed by the model.
// ============================================================================

export interface CoachPipelineResult {
  request: CoachRequest;
  insights: CoachInsight[];
}

/**
 * Builds everything the coach needs to answer a user message, entirely from
 * authoritative sources. Requires a real authenticated userId (throws
 * otherwise) and scopes every fetch to that user.
 */
export async function buildCoachRequest(
  userId: string,
  userMessage: string,
): Promise<CoachPipelineResult> {
  requireUserId(userId);

  const intent = detectIntent(userMessage);
  const snapshot = await buildFinancialSnapshot(userId);

  const parsed = parseScenario(userMessage);
  const scenario = parsed ? runCoachScenario(snapshot, parsed) : null;

  const context = buildCoachContext(snapshot, intent);
  const insights = buildProactiveInsights(snapshot);

  return {
    request: {
      intent,
      context,
      scenario,
      unavailableSources: snapshot.unavailableSources,
      userMessage,
    },
    insights,
  };
}

/**
 * Deterministic top insights for the dashboard card. No LLM call — pure rules
 * over the authoritative snapshot, so it never exposes data to a provider.
 */
export async function getCoachInsights(userId: string): Promise<CoachInsight[]> {
  requireUserId(userId);
  const snapshot = await buildFinancialSnapshot(userId);
  return buildProactiveInsights(snapshot);
}

export { buildProactiveInsights };
