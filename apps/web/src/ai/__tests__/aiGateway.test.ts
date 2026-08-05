import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AiGatewayError,
  GATEWAY_REQUEST_TIMEOUT_MS,
  gatewayChat,
  gatewayStream,
  testGatewayConnection,
} from '@/ai/services/aiGateway';
import type { AiMessage } from '@/ai/types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'test-session-token' } },
        error: null,
      })),
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      refreshSession: vi.fn(async () => ({
        data: { session: null },
        error: new Error('refresh unavailable'),
      })),
    },
  },
}));

const MESSAGES: AiMessage[] = [{ role: 'user', content: 'hello' }];

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  return null;
}

describe('aiGateway', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed content, model and usage for a successful chat response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        choices: [{ message: { content: 'Hello' } }],
        model: 'gemini-2.0-flash',
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    );

    const result = await gatewayChat({ messages: MESSAGES, provider: 'gemini' });

    expect(result.content).toBe('Hello');
    expect(result.model).toBe('gemini-2.0-flash');
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 });
  });

  it('maps a 429 to a friendly RATE_LIMIT error and surfaces retryAfter', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(429, { error: 'Gemini API error: 429', code: 'PROVIDER_RATE_LIMIT', retryAfter: 30 }),
    );

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.code).toBe('RATE_LIMIT');
    expect(e.status).toBe(429);
    expect(e.retryAfter).toBe(30);
    expect(e.message).toBe('AI Copilot is temporarily rate-limited. Please try again shortly.');
    expect(e.message).not.toContain('Gemini API error');
  });

  it('maps a 429 without retryAfter to a friendly error', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, { error: 'Rate limit exceeded. Try again later.' }));

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.code).toBe('RATE_LIMIT');
    expect(e.status).toBe(429);
    expect(e.retryAfter).toBeUndefined();
    expect(e.message).toBe('AI Copilot is temporarily rate-limited. Please try again shortly.');
  });

  it('maps a 401 to a friendly AUTH error', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.code).toBe('AUTH');
    expect(e.status).toBe(401);
    expect(e.message).toBe('Not authenticated. Please sign in.');
  });

  it('maps a provider failure to a friendly GATEWAY error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(500, { error: 'The AI provider is temporarily unavailable. Please try again shortly.' }),
    );

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.code).toBe('GATEWAY');
    expect(e.status).toBe(500);
    expect(e.message).toBe('The AI provider is temporarily unavailable. Please try again shortly.');
  });

  it('falls back gracefully when the error body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('<html>oops</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
    );

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.status).toBe(502);
    expect(e.message).toBe('Gateway error: 502');
  });

  it('handles a malformed success body without crashing', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, {}));

    const result = await gatewayChat({ messages: MESSAGES, provider: 'gemini' });

    expect(result.content).toBe('');
  });

  it('does not auto-retry a 429 from the gateway (exactly one request)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, { error: 'Gemini API error: 429' }));

    await captureError(gatewayChat({ messages: MESSAGES, provider: 'gemini' }));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sends an authenticated request to the gateway with no provider key', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { choices: [{ message: { content: 'ok' } }] }));

    await gatewayChat({ messages: MESSAGES, provider: 'gemini' });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/functions/v1/ai-gateway');
    expect(url).not.toContain('generativelanguage.googleapis.com');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-session-token');
    expect(JSON.stringify(headers)).not.toMatch(/api[_-]?key/i);

    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty('apiKey');
    expect(body).not.toHaveProperty('geminiApiKey');
  });

  it('yields chunks from an SSE stream', async () => {
    const sse =
      'data: {"choices":[{"delta":{"content":"Hel","finish_reason":null}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"lo","finish_reason":null}}]}\n\n' +
      'data: [DONE]\n\n';
    vi.mocked(fetch).mockResolvedValue(
      new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
    );

    const chunks: string[] = [];
    for await (const chunk of gatewayStream({ messages: MESSAGES, provider: 'gemini' })) {
      chunks.push(chunk.content);
    }

    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('maps a 429 during streaming to a friendly RATE_LIMIT error', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, { error: 'Gemini API error: 429' }));

    let caught: unknown;
    try {
      for await (const _chunk of gatewayStream({ messages: MESSAGES, provider: 'gemini' })) {
        // no chunks expected
      }
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AiGatewayError);
    const e = caught as AiGatewayError;
    expect(e.code).toBe('RATE_LIMIT');
    expect(e.message).toBe('AI Copilot is temporarily rate-limited. Please try again shortly.');
  });

  it('testGatewayConnection reports the friendly message on a 429', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, { error: 'Gemini API error: 429' }));

    const result = await testGatewayConnection('gemini');

    expect(result.success).toBe(false);
    expect(result.message).toBe('AI Copilot is temporarily rate-limited. Please try again shortly.');
  });

  it('maps a network failure to a friendly NETWORK error', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'groq' }));

    expect(err).toBeInstanceOf(AiGatewayError);
    const e = err as AiGatewayError;
    expect(e.code).toBe('NETWORK');
    expect(e.message).toBe('Unable to reach the AI service. Please check your connection and try again.');
  });

  it('maps a gateway timeout to a friendly TIMEOUT error', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            (init as RequestInit | undefined)?.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted.', 'AbortError')),
            );
          }),
      );

      const pending = captureError(gatewayChat({ messages: MESSAGES, provider: 'groq' }));
      await vi.advanceTimersByTimeAsync(GATEWAY_REQUEST_TIMEOUT_MS);
      const err = await pending;

      expect(err).toBeInstanceOf(AiGatewayError);
      const e = err as AiGatewayError;
      expect(e.code).toBe('TIMEOUT');
      expect(e.message).toBe('The AI service took too long to respond. Please try again.');
    } finally {
      vi.useRealTimers();
    }
  });

  describe('Groq provider', () => {
    it('routes requests to the gateway with provider groq and the configured model', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse(200, { choices: [{ message: { content: 'Groq reply' } }], model: 'llama-3.3-70b-versatile' }),
      );

      const result = await gatewayChat({
        messages: MESSAGES,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/functions/v1/ai-gateway');
      const body = JSON.parse(init.body as string);
      expect(body.provider).toBe('groq');
      expect(body.model).toBe('llama-3.3-70b-versatile');
      expect(result.content).toBe('Groq reply');
    });

    it('does not send a Groq API key to the gateway', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { choices: [{ message: { content: 'ok' } }] }));

      await gatewayChat({ messages: MESSAGES, provider: 'groq' });

      const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(JSON.stringify(headers)).not.toMatch(/gsk_/);
      expect(JSON.stringify(headers)).not.toMatch(/api[_-]?key/i);

      const body = JSON.parse(init.body as string);
      expect(body).not.toHaveProperty('apiKey');
      expect(body).not.toHaveProperty('groqApiKey');
      expect(JSON.stringify(body)).not.toMatch(/gsk_/);
    });

    it('yields chunks from a Groq SSE stream', async () => {
      const sse =
        'data: {"choices":[{"delta":{"content":"You","finish_reason":null}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"r ","finish_reason":null}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"budget","finish_reason":null}}]}\n\n' +
        'data: [DONE]\n\n';
      vi.mocked(fetch).mockResolvedValue(
        new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      );

      const chunks: string[] = [];
      for await (const chunk of gatewayStream({ messages: MESSAGES, provider: 'groq' })) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual(['You', 'r ', 'budget']);
    });

    it('maps a Groq 429 to a friendly RATE_LIMIT error', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(429, { error: 'Groq API error: 429' }));

      const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'groq' }));

      expect(err).toBeInstanceOf(AiGatewayError);
      const e = err as AiGatewayError;
      expect(e.code).toBe('RATE_LIMIT');
      expect(e.status).toBe(429);
      expect(e.message).toBe('AI Copilot is temporarily rate-limited. Please try again shortly.');
    });

    it('maps a Groq 400 to a friendly GATEWAY error', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(400, { error: 'Bad Request' }));

      const err = await captureError(gatewayChat({ messages: MESSAGES, provider: 'groq' }));

      expect(err).toBeInstanceOf(AiGatewayError);
      const e = err as AiGatewayError;
      expect(e.code).toBe('GATEWAY');
      expect(e.status).toBe(400);
      expect(e.message).toBe('Bad Request');
    });
  });
});
