import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey ?? ''}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

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
        const content = parsed.choices?.[0]?.delta?.content ?? '';
        if (content) {
          yield { content, model: config.model };
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

async function testConnection(config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey ?? ''}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'Connected successfully' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Authentication failed. Check that your API key is correct.' };
    }

    if (response.status === 402) {
      return { success: false, message: 'Insufficient balance. Please add credits to your DeepSeek account.' };
    }

    return { success: false, message: `Error ${response.status}: ${response.statusText}` };
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      return { success: false, message: 'Could not reach the DeepSeek API. Check your internet connection and base URL.' };
    }
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export const DeepSeekProvider: AiProvider = {
  name: 'deepseek' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey ?? ''}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? config.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      } : undefined,
    };
  },

  stream: streamChat,
  testConnection,
};
