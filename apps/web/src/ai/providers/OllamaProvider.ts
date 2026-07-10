import type { AiProvider, AiProviderName, AiMessage, AiResponse, AiProviderConfig } from '@/ai/types';

const DEFAULT_BASE_URL = 'http://localhost:11434';

async function* streamChat(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse> {
  const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      options: { temperature: config.temperature },
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        const content = parsed.message?.content ?? '';
        if (content) {
          yield { content, model: parsed.model ?? config.model };
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

async function testConnection(config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/api/tags`);

    if (response.ok) {
      const data = await response.json();
      const models = data.models ?? [];
      if (models.length === 0) {
        return { success: true, message: 'Ollama is running, but no models are installed. Download a model (e.g., `ollama pull llama3`).' };
      }
      const hasModel = models.some((m: { name?: string }) => m.name?.includes(config.model));
      if (!hasModel) {
        const modelNames = models.map((m: { name?: string }) => m.name?.split(':')[0]).join(', ');
        return { success: true, message: `Connected. Available models: ${modelNames}. The selected model "${config.model}" is not installed.` };
      }
      return { success: true, message: 'Connected successfully' };
    }

    if (response.status === 404) {
      return { success: false, message: 'Ollama API not found. Make sure Ollama is running (ollama serve).' };
    }

    return { success: false, message: `Error ${response.status}: ${response.statusText}` };
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      return { success: false, message: 'Could not connect to Ollama. Ensure the server is running at the configured URL.' };
    }
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export const OllamaProvider: AiProvider = {
  name: 'ollama' as AiProviderName,

  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        options: { temperature: config.temperature },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content ?? '',
      model: data.model ?? config.model,
    };
  },

  stream: streamChat,
  testConnection,
};
