import type { AiMessage } from '@/ai/types';

const TOKENS_PER_CHAR = 0.25;

const MODEL_PRICING: Record<string, { inputPer1K: number; outputPer1K: number }> = {
  'gpt-4o-mini': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
  'gpt-4o': { inputPer1K: 0.0025, outputPer1K: 0.01 },
  'gpt-4-turbo': { inputPer1K: 0.01, outputPer1K: 0.03 },
  'gpt-4.1': { inputPer1K: 0.002, outputPer1K: 0.008 },
  'gpt-4.1-mini': { inputPer1K: 0.0004, outputPer1K: 0.0016 },
  'gpt-4.1-nano': { inputPer1K: 0.0001, outputPer1K: 0.0004 },
};

const MODEL_MAX_TOKENS: Record<string, number> = {
  'gpt-4o-mini': 128000,
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4.1': 1048576,
  'gpt-4.1-mini': 1048576,
  'gpt-4.1-nano': 1048576,
};

const DEFAULT_MAX_TOKENS = 128000;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}

export function estimateMessagesTokens(messages: AiMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content) + 4;
  }
  return total + 2;
}

export function getModelMaxTokens(model: string): number {
  return MODEL_MAX_TOKENS[model] ?? DEFAULT_MAX_TOKENS;
}

export function getModelPricing(model: string): { inputPer1K: number; outputPer1K: number } {
  return MODEL_PRICING[model] ?? { inputPer1K: 0.0025, outputPer1K: 0.01 };
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);
  return (inputTokens / 1000) * pricing.inputPer1K + (outputTokens / 1000) * pricing.outputPer1K;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 100).toFixed(2)}¢`;
  return `$${cost.toFixed(4)}`;
}

export function trimMessagesToFit(messages: AiMessage[], model: string, reserveTokens = 4096): AiMessage[] {
  const maxTokens = getModelMaxTokens(model);
  const targetTokens = maxTokens - reserveTokens;
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  const systemTokens = estimateMessagesTokens(systemMessages);
  let available = targetTokens - systemTokens;

  const trimmed: AiMessage[] = [...systemMessages];
  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const msg = nonSystemMessages[i];
    if (!msg) continue;
    const msgTokens = estimateTokens(msg.content) + 4;
    if (available - msgTokens < 0) break;
    available -= msgTokens;
    trimmed.push(msg);
  }

  return trimmed;
}

export function summarizeSystemPrompt(prompt: string, maxTokens = 2000): string {
  const estimated = estimateTokens(prompt);
  if (estimated <= maxTokens) return prompt;
  const maxChars = Math.floor(maxTokens / TOKENS_PER_CHAR);
  return prompt.slice(0, maxChars) + '\n[Context truncated due to length]';
}
