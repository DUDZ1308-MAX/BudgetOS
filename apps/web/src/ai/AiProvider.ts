import type { AiProvider, AiProviderName, AiProviderConfig } from '@/ai/types';
import { OpenAIProvider } from '@/ai/providers/OpenAIProvider';
import { OllamaProvider } from '@/ai/providers/OllamaProvider';
import { DeepSeekProvider } from '@/ai/providers/DeepSeekProvider';

const providers: Record<AiProviderName, AiProvider> = {
  openai: OpenAIProvider,
  ollama: OllamaProvider,
  deepseek: DeepSeekProvider,
};

const defaultConfigs: Record<AiProviderName, AiProviderConfig> = {
  openai: { model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 2048, streaming: true },
  ollama: { model: 'llama3', temperature: 0.7, maxTokens: 2048, streaming: true },
  deepseek: { model: 'deepseek-chat', temperature: 0.7, maxTokens: 2048, streaming: true },
};

export function getAiProvider(name: AiProviderName): AiProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown AI provider: ${name}`);
  return provider;
}

export function getDefaultConfig(name: AiProviderName): AiProviderConfig {
  return { ...defaultConfigs[name] };
}

export function getSupportedProviders(): AiProviderName[] {
  return Object.keys(providers) as AiProviderName[];
}

export async function testProviderConnection(name: AiProviderName, config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  const provider = getAiProvider(name);
  return provider.testConnection(config);
}

export type { AiProvider, AiProviderName, AiProviderConfig };
