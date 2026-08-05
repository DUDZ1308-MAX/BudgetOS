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
import { useAiSettingsStore } from '@/stores/aiSettings';

describe('AI provider selection', () => {
  beforeEach(() => {
    useAiSettingsStore.setState({
      provider: 'groq',
      config: getDefaultConfig('groq'),
    });
  });

  it('registers Groq as a supported provider', () => {
    expect(getSupportedProviders()).toContain('groq');
  });

  it('returns the Groq provider with chat, stream and testConnection', () => {
    const provider = getAiProvider('groq');
    expect(provider.name).toBe('groq');
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.testConnection).toBe('function');
  });

  it('configures Groq with a current production model and no frontend key', () => {
    const config = getDefaultConfig('groq');
    expect(config.model).toBe('llama-3.3-70b-versatile');
    expect(config.streaming).toBe(true);
    expect(config.temperature).toBe(0.7);
    expect(config.apiKey).toBeUndefined();
  });

  it('defaults the active provider to Groq', () => {
    const state = useAiSettingsStore.getState();
    expect(state.provider).toBe('groq');
    expect(state.config.model).toBe('llama-3.3-70b-versatile');
    expect(state.providerSetups.groq.baseUrl).toContain('/functions/v1/ai-gateway');
  });

  it('keeps Gemini available for switching', () => {
    expect(getSupportedProviders()).toContain('gemini');
    expect(getAiProvider('gemini').name).toBe('gemini');
  });
});
