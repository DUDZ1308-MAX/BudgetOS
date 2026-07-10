export type AIAction = 'chat_message' | 'insight_generation' | 'forecast_generation' | 'recommendation';

export const AI_USAGE_COST: Record<AIAction, number> = {
  chat_message: 1,
  insight_generation: 2,
  forecast_generation: 3,
  recommendation: 1,
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateAICost(action: AIAction, inputTokens: number, outputTokens: number): number {
  const base = AI_USAGE_COST[action] ?? 1;
  const tokens = inputTokens + outputTokens;
  return base + Math.ceil(tokens / 1000);
}
