import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';
import { gatewayChat, gatewayStream, testGatewayConnection } from '@/ai/services/aiGateway';

export { AiGatewayError } from '@/ai/services/aiGateway';

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  yield* gatewayStream({ messages, provider: 'openai', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
}

async function testConnection(_config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  return testGatewayConnection('openai');
}

export const OpenAIProvider: AiProvider = {
  name: 'openai' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    return gatewayChat({ messages, provider: 'openai', model: config.model, temperature: config.temperature, maxTokens: config.maxTokens });
  },

  stream: streamChat,
  testConnection,
};
