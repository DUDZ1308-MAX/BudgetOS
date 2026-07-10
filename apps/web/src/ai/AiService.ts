import type { AiProviderName, AiProviderConfig, AiContext, AiMessage, ChatSession } from '@/ai/types';
import { getAiProvider } from '@/ai/AiProvider';
import { buildSystemPrompt, buildUserPrompt, buildConversationContext, buildInitialPrompt } from '@/ai/PromptBuilder';
import { ChatHistory } from '@/ai/ChatHistory';

export class AiService {
  private providerName: AiProviderName;
  private config: AiProviderConfig;

  constructor(providerName: AiProviderName, config: AiProviderConfig) {
    this.providerName = providerName;
    this.config = config;
  }

  updateConfig(providerName: AiProviderName, config: AiProviderConfig): void {
    this.providerName = providerName;
    this.config = config;
  }

  async sendMessage(
    session: ChatSession,
    userMessage: string,
    context: AiContext,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(userMessage, context);

    const provider = getAiProvider(this.providerName);

    session.messages.push({ role: 'user', content: userMessage });
    ChatHistory.addMessage(session.id, { role: 'user', content: userMessage });

    const messages: AiMessage[] = [
      { role: 'system', content: systemPrompt },
      ...buildConversationContext(session).slice(-30),
      { role: 'user', content: userPrompt },
    ];

    if (this.config.streaming && provider.stream) {
      let fullContent = '';
      const stream = provider.stream(messages, this.config);

      for await (const chunk of stream) {
        fullContent += chunk.content;
        onStream?.(chunk.content);
      }

      session.messages.push({ role: 'assistant', content: fullContent });
      ChatHistory.addMessage(session.id, { role: 'assistant', content: fullContent });

      if (session.title === 'New Chat' && fullContent.length > 0) {
        const title = userMessage.length > 50 ? userMessage.slice(0, 50) + '...' : userMessage;
        ChatHistory.updateTitle(session.id, title);
        session.title = title;
      }

      return fullContent;
    }

    const response = await provider.chat(messages, this.config);

    session.messages.push({ role: 'assistant', content: response.content });
    ChatHistory.addMessage(session.id, { role: 'assistant', content: response.content });

    if (session.title === 'New Chat' && response.content.length > 0) {
      const title = userMessage.length > 50 ? userMessage.slice(0, 50) + '...' : userMessage;
      ChatHistory.updateTitle(session.id, title);
      session.title = title;
    }

    return response.content;
  }

  async getInitialGreeting(session: ChatSession, context: AiContext): Promise<string> {
    const greeting = buildInitialPrompt(context);

    if (this.config.streaming && getAiProvider(this.providerName).stream) {
      return greeting;
    }

    return greeting;
  }
}

export { ChatHistory };
