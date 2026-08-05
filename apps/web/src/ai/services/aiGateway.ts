import type { AiMessage, AiProviderName, AiResponse } from '@/ai/types';
import { supabase } from '@/lib/supabase';

export type GatewayProvider = 'openai' | 'deepseek' | 'gemini' | 'groq';

interface GatewayChatRequest {
  messages: AiMessage[];
  provider: GatewayProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export const GATEWAY_REQUEST_TIMEOUT_MS = 60_000;

const NETWORK_ERROR_MESSAGE = 'Unable to reach the AI service. Please check your connection and try again.';
const TIMEOUT_ERROR_MESSAGE = 'The AI service took too long to respond. Please try again.';

export class AiGatewayError extends Error {
  code: string;
  status?: number;
  retryAfter?: number;

  constructor(message: string, code: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = 'AiGatewayError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const RATE_LIMIT_MESSAGE = 'AI Copilot is temporarily rate-limited. Please try again shortly.';
const AUTH_MESSAGE = 'Not authenticated. Please sign in.';

interface GatewayErrorBody {
  message: string;
  retryAfter?: number;
}

async function readGatewayError(response: Response): Promise<GatewayErrorBody> {
  const data = (await response
    .json()
    .catch(() => null)) as { error?: string; message?: string; retryAfter?: number } | null;
  const retryAfter =
    typeof data?.retryAfter === 'number' && data.retryAfter >= 0 ? data.retryAfter : undefined;
  const message = data?.error ?? data?.message ?? `Gateway error: ${response.status}`;
  return { message, retryAfter };
}

function toGatewayError(response: Response, body: GatewayErrorBody): AiGatewayError {
  if (response.status === 429) {
    return new AiGatewayError(RATE_LIMIT_MESSAGE, 'RATE_LIMIT', 429, body.retryAfter);
  }
  if (response.status === 401) {
    return new AiGatewayError(AUTH_MESSAGE, 'AUTH', 401);
  }
  return new AiGatewayError(body.message || `Gateway error: ${response.status}`, 'GATEWAY', response.status);
}

function getGatewayUrl(): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/ai-gateway`;
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GATEWAY_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new AiGatewayError(TIMEOUT_ERROR_MESSAGE, 'TIMEOUT');
    }
    throw new AiGatewayError(NETWORK_ERROR_MESSAGE, 'NETWORK');
  } finally {
    clearTimeout(timeout);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new AiGatewayError('Not authenticated. Please sign in.', 'AUTH');
  }

  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed?.access_token) {
      throw new AiGatewayError('Session expired. Please sign in again.', 'AUTH');
    }
    return {
      Authorization: `Bearer ${refreshed.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  const { data: { session: fresh } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${fresh?.access_token ?? session.access_token}`,
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

  const response = await fetchWithTimeout(getGatewayUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw toGatewayError(response, await readGatewayError(response));
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

  const response = await fetchWithTimeout(getGatewayUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw toGatewayError(response, await readGatewayError(response));
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AiGatewayError('No response body', 'NO_BODY');

  const decoder = new TextDecoder();
  let buffer = '';
  let model = request.model ?? 'unknown';

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch {
        throw new AiGatewayError(NETWORK_ERROR_MESSAGE, 'NETWORK');
      }
      if (chunk.done) break;

      buffer += decoder.decode(chunk.value, { stream: true });
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
      if (err.code === 'AUTH') {
        return { success: false, message: err.message };
      }
      if (err.status === 401) {
        return { success: false, message: 'Not authenticated. Please sign in.' };
      }
      if (err.status === 429) {
        return { success: false, message: RATE_LIMIT_MESSAGE };
      }
      return { success: false, message: err.message };
    }
    return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
  }
}
