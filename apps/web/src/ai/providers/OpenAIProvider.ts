import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';
import { AiClient, AiClientError } from '@/ai/services/aiClient';

export { AiClient, AiClientError };

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  const client = new AiClient(config);
  yield* client.stream(messages);
}

async function testConnection(config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  const client = new AiClient(config);
  return client.testConnection();
}

export const OpenAIProvider: AiProvider = {
  name: 'openai' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const client = new AiClient(config);
    return client.chat(messages);
  },

  stream: streamChat,
  testConnection,
};
