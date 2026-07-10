import type { AiMessage, AiProviderConfig, AiResponse } from '@/ai/types';
import { createStreamParser } from '@/ai/utils/responseParser';
import { trimMessagesToFit, estimateMessagesTokens, getModelMaxTokens, estimateCost, formatCost } from '@/ai/utils/tokenManager';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

export class AiClient {
  private config: AiProviderConfig;
  private abortController: AbortController | null = null;
  private retryCount = 0;

  constructor(config: AiProviderConfig) {
    this.config = config;
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  get isCancelled(): boolean {
    return this.abortController?.signal.aborted ?? false;
  }

  private getBaseUrl(): string {
    return this.config.baseUrl ?? DEFAULT_BASE_URL;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey ?? ''}`,
    };
  }

  private buildRequestBody(messages: AiMessage[], stream: boolean): Record<string, unknown> {
    return {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens ?? 2048,
      stream,
    };
  }

  private trimMessages(messages: AiMessage[]): AiMessage[] {
    const model = this.config.model;
    const totalTokens = estimateMessagesTokens(messages);
    const maxTokens = getModelMaxTokens(model);

    if (totalTokens <= maxTokens * 0.8) return messages;

    const reserveTokens = Math.max(this.config.maxTokens ?? 2048, 4096);
    return trimMessagesToFit(messages, model, reserveTokens);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    this.retryCount = 0;

    while (true) {
      try {
        const response = await fetch(url, options);

        if (response.ok) return response;

        if (response.status === 429 && this.retryCount < retries) {
          this.retryCount++;
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount - 1), MAX_RETRY_DELAY);

          await this.delay(delayMs);
          continue;
        }

        if (response.status >= 500 && this.retryCount < retries) {
          this.retryCount++;
          const delayMs = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount - 1), MAX_RETRY_DELAY);
          await this.delay(delayMs);
          continue;
        }

        return response;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new AiClientError('Request cancelled', 'CANCELLED');
        }

        if (this.retryCount < retries) {
          this.retryCount++;
          const delayMs = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount - 1), MAX_RETRY_DELAY);
          await this.delay(delayMs);
          continue;
        }

        throw new AiClientError(
          err instanceof Error ? err.message : 'Network error',
          'NETWORK',
        );
      }
    }
  }

  async chat(messages: AiMessage[]): Promise<AiResponse> {
    this.abortController = new AbortController();
    const trimmed = this.trimMessages(messages);
    const body = this.buildRequestBody(trimmed, false);

    const response = await this.fetchWithRetry(
      `${this.getBaseUrl()}/chat/completions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      },
    );

    if (!response.ok) {
      throw await this.buildError(response);
    }

    const data = await response.json();
    const usage = data.usage
      ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
      : undefined;

    if (usage) {
      const cost = estimateCost(this.config.model, usage.promptTokens, usage.completionTokens);
    }

    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? this.config.model,
      usage,
    };
  }

  async *stream(messages: AiMessage[]): AsyncIterable<AiResponse> {
    this.abortController = new AbortController();
    const trimmed = this.trimMessages(messages);
    const body = this.buildRequestBody(trimmed, true);

    const response = await this.fetchWithRetry(
      `${this.getBaseUrl()}/chat/completions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      },
    );

    if (!response.ok) {
      throw await this.buildError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new AiClientError('No response body from API', 'NO_BODY');

    const decoder = new TextDecoder();
    const parse = createStreamParser();
    let model = this.config.model;

    try {
      while (true) {
        if (this.isCancelled) throw new AiClientError('Request cancelled', 'CANCELLED');

        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const chunks = parse(text);

        for (const chunk of chunks) {
          if (chunk.done) return;
          if (chunk.model) model = chunk.model;
          if (chunk.content) {
            yield { content: chunk.content, model };
          }
        }
      }
    } catch (err) {
      if (err instanceof AiClientError) throw err;
      throw new AiClientError(
        err instanceof Error ? err.message : 'Stream interrupted',
        'STREAM_ERROR',
      );
    } finally {
      reader.releaseLock();
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.getBaseUrl()}/models`, {
        headers: this.getHeaders(),
        signal: this.abortController.signal,
      });

      if (response.ok) {
        return { success: true, message: 'Connected successfully' };
      }

      if (response.status === 401) {
        return { success: false, message: 'Authentication failed. Check that your API key is correct and has not expired.' };
      }

      if (response.status === 429) {
        return { success: false, message: 'Rate limited. Please wait a moment and try again.' };
      }

      return { success: false, message: `Error ${response.status}: ${response.statusText}` };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, message: 'Connection test cancelled.' };
      }
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        return { success: false, message: 'Could not reach the OpenAI API. Check your internet connection and base URL.' };
      }
      return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  private async buildError(response: Response): Promise<AiClientError> {
    const status = response.status;
    let message = `OpenAI API error: ${status}`;

    try {
      const body = await response.json();
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      message = `OpenAI API error: ${status} ${response.statusText}`;
    }

    if (status === 401) return new AiClientError('Invalid API key. Please check your settings.', 'AUTH');
    if (status === 403) return new AiClientError('Access denied. Your API key may not have access to this model.', 'AUTH');
    if (status === 404) return new AiClientError('Model not found. Check that the model name is correct.', 'MODEL_NOT_FOUND');
    if (status === 429) return new AiClientError('Rate limited by OpenAI. Please wait and try again.', 'RATE_LIMIT');
    if (status === 500) return new AiClientError('OpenAI server error. Please try again later.', 'SERVER_ERROR');

    return new AiClientError(message, 'API_ERROR');
  }
}

export class AiClientError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AiClientError';
    this.code = code;
  }
}
