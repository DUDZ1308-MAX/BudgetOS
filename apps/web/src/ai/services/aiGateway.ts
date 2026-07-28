import type { AiMessage, AiProviderName, AiResponse } from '@/ai/types';
import { supabase } from '@/lib/supabase';

export type GatewayProvider = 'openai' | 'deepseek' | 'gemini';

interface GatewayChatRequest {
  messages: AiMessage[];
  provider: GatewayProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class AiGatewayError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'AiGatewayError';
    this.code = code;
    this.status = status;
  }
}

function getGatewayUrl(): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/ai-gateway`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new AiGatewayError('Not authenticated. Please sign in.', 'AUTH');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function gatewayChat(request: GatewayChatRequest): Promise<AiResponse> {
  const headers = await getAuthHeaders();

  const body: Record<string, unknown> = {
    messages: request.messages,
    provider: request.provider,
    model: request.model,
    temperature: request.temperature ?? 0.7,
    maxTokens: request.maxTokens ?? 2048,
    stream: false,
  };

  const response = await fetch(getGatewayUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new AiGatewayError(
      error.error ?? `Gateway error: ${response.status}`,
      'GATEWAY',
      response.status,
    );
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? request.model ?? 'unknown',
    usage: data.usage
      ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
      : undefined,
  };
}

export async function* gatewayStream(
  request: GatewayChatRequest,
): AsyncIterable<AiResponse> {
  const headers = await getAuthHeaders();

  const body: Record<string, unknown> = {
    messages: request.messages,
    provider: request.provider,
    model: request.model,
    temperature: request.temperature ?? 0.7,
    maxTokens: request.maxTokens ?? 2048,
    stream: true,
  };

  const response = await fetch(getGatewayUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new AiGatewayError(
      error.error ?? `Gateway error: ${response.status}`,
      'GATEWAY',
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AiGatewayError('No response body', 'NO_BODY');

  const decoder = new TextDecoder();
  let buffer = '';
  let model = request.model ?? 'unknown';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.model) model = parsed.model;
          const content = parsed.choices?.[0]?.delta?.content ?? '';
          if (content) {
            yield { content, model };
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function testGatewayConnection(
  provider: GatewayProvider,
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await gatewayChat({
      messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
      provider,
      maxTokens: 10,
    });
    return { success: true, message: `Connected via gateway (${provider})` };
  } catch (err) {
    if (err instanceof AiGatewayError) {
      if (err.status === 401) {
        return { success: false, message: 'Not authenticated. Please sign in.' };
      }
      if (err.status === 429) {
        return { success: false, message: 'Rate limited. Please wait and try again.' };
      }
      return { success: false, message: err.message };
    }
    return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
  }
}
