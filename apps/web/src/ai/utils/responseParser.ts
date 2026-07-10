export interface StreamChunk {
  content: string;
  done: boolean;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface ParseError {
  line: number;
  message: string;
  raw: string;
}

export function parseSSELine(line: string): { data: string } | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data: ')) return null;
  const data = trimmed.slice(6);
  if (data === '[DONE]') return { data: '[DONE]' };
  return { data };
}

export function parseOpenAIStreamChunk(data: string): { content: string; model?: string; finishReason?: string } {
  try {
    const parsed = JSON.parse(data);
    const choice = parsed.choices?.[0];
    return {
      content: choice?.delta?.content ?? choice?.text ?? '',
      model: parsed.model,
      finishReason: choice?.finish_reason ?? null,
    };
  } catch {
    return { content: '' };
  }
}

export function* parseStreamBuffer(buffer: string): Generator<StreamChunk, void, undefined> {
  const lines = buffer.split('\n');
  for (const line of lines) {
    const parsed = parseSSELine(line);
    if (!parsed) continue;
    if (parsed.data === '[DONE]') {
      yield { content: '', done: true };
      return;
    }
    const chunk = parseOpenAIStreamChunk(parsed.data);
    yield { content: chunk.content, done: false, model: chunk.model };
  }
}

export function createStreamParser() {
  let buffer = '';

  return function processChunk(chunk: string): StreamChunk[] {
    buffer += chunk;
    const results: StreamChunk[] = [];
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSSELine(line);
      if (!parsed) continue;
      if (parsed.data === '[DONE]') {
        results.push({ content: '', done: true });
        continue;
      }
      const chunkData = parseOpenAIStreamChunk(parsed.data);
      if (chunkData.content) {
        results.push({ content: chunkData.content, done: false, model: chunkData.model });
      }
    }

    return results;
  };
}
