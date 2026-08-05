import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';
import { gatewayChat, gatewayStream, testGatewayConnection } from '@/ai/services/aiGateway';

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  yield* gatewayStream({ messages, provider: 'groq', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
}

async function testConnection(_config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  return testGatewayConnection('groq');
}

export const GroqProvider: AiProvider = {
  name: 'groq' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    return gatewayChat({ messages, provider: 'groq', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
  },

  stream: streamChat,
  testConnection,
};
