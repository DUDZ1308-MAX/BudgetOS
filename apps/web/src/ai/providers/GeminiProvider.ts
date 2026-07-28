import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';
import { gatewayChat, gatewayStream, testGatewayConnection } from '@/ai/services/aiGateway';

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  yield* gatewayStream({ messages, provider: 'gemini', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
}

async function testConnection(_config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  return testGatewayConnection('gemini');
}

export const GeminiProvider: AiProvider = {
  name: 'gemini' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    return gatewayChat({ messages, provider: 'gemini', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
  },

  stream: streamChat,
  testConnection,
};
