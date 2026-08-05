import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 't' } }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      refreshSession: vi.fn(async () => ({ data: { session: null }, error: new Error('x') })),
    },
  },
}));

import { getAiProvider, getSupportedProviders, getDefaultConfig } from '@/ai/AiProvider';
import { GroqProvider } from '@/ai/providers/GroqProvider';
import { gatewayChat } from '@/ai/services/aiGateway';
import { useAiSettingsStore } from '@/stores/aiSettings';

const EDGE_SOURCE = readFileSync(
  path.resolve(process.cwd(), '../../supabase/functions/ai-gateway/index.ts'),
  'utf8',
);

describe('GROQ provider routing regression (Unsupported provider: groq)', () => {
  beforeEach(() => {
    useAiSettingsStore.setState({
      provider: 'groq',
      config: getDefaultConfig('groq'),
    });
  });

  it('accepts groq as a supported provider in both frontend and gateway registry', () => {
    expect(getSupportedProviders()).toContain('groq');
    expect(EDGE_SOURCE).toContain('groq: "llama-3.3-70b-versatile"');
    expect(EDGE_SOURCE).toContain('groq: "https://api.groq.com/openai/v1/chat/completions"');
  });

  it('resolves groq to the GroqProvider implementation', () => {
    expect(getAiProvider('groq')).toBe(GroqProvider);
  });

  it('instantiates GroqProvider with chat, stream and testConnection', () => {
    const provider = getAiProvider('groq');
    expect(provider.name).toBe('groq');
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.testConnection).toBe('function');
  });

  it('resolves the groq model in the frontend config and the gateway PROVIDER_MODELS', () => {
    expect(getDefaultConfig('groq').model).toBe('llama-3.3-70b-versatile');
    expect(EDGE_SOURCE).toMatch(/PROVIDER_MODELS[^}]*groq: "llama-3\.3-70b-versatile"/);
  });

  it('resolves the groq upstream URL in the gateway provider URL map', () => {
    expect(EDGE_SOURCE).toContain('https://api.groq.com/openai/v1/chat/completions');
  });

  it('constructs the gateway request with provider "groq"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await gatewayChat({ messages: [{ role: 'user', content: 'hi' }], provider: 'groq' });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(url).toContain('/functions/v1/ai-gateway');
    expect(body.provider).toBe('groq');
    vi.unstubAllGlobals();
  });

  it('still rejects unsupported providers instead of mis-routing groq', () => {
    expect(() => getAiProvider('definitely-invalid-provider' as never)).toThrow(/Unknown AI provider/);
    expect(EDGE_SOURCE).toContain('Unsupported provider: ${provider}');
    expect(EDGE_SOURCE).toContain('const url = urls[provider]');
    expect(EDGE_SOURCE).toContain('if (!url)');
  });

  it('keeps Gemini as a valid switchable provider', () => {
    expect(getSupportedProviders()).toContain('gemini');
    expect(getAiProvider('gemini').name).toBe('gemini');
    expect(EDGE_SOURCE).toMatch(/PROVIDER_MODELS[^}]*gemini: "gemini-2\.0-flash"/);
  });

  it('defaults the active provider to groq', () => {
    const state = useAiSettingsStore.getState();
    expect(state.provider).toBe('groq');
    expect(state.config.model).toBe('llama-3.3-70b-versatile');
  });
});
