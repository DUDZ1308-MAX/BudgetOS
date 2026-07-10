import type { ChatSession, AiMessage } from '@/ai/types';
import { ConversationMemory } from '@/ai/ConversationMemory';

function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ChatHistory = {
  createSession(title: string = 'New Chat'): ChatSession {
    const now = new Date().toISOString();
    return {
      id: generateId(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
      pinned: false,
    };
  },

  saveSession(session: ChatSession): void {
    ConversationMemory.save({
      id: session.id,
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      pinned: session.pinned,
    });
  },

  getSession(id: string): ChatSession | null {
    const stored = ConversationMemory.get(id);
    if (!stored) return null;
    return {
      id: stored.id,
      title: stored.title,
      messages: stored.messages,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
      pinned: stored.pinned,
    };
  },

  getAllSessions(): ChatSession[] {
    return ConversationMemory.getAll().map((c) => ({
      id: c.id,
      title: c.title,
      messages: c.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      pinned: c.pinned,
    }));
  },

  deleteSession(id: string): void {
    ConversationMemory.delete(id);
  },

  addMessage(sessionId: string, message: AiMessage): void {
    ConversationMemory.addMessage(sessionId, message);
  },

  togglePin(sessionId: string): void {
    ConversationMemory.togglePin(sessionId);
  },

  clearAll(): void {
    ConversationMemory.clearAll();
  },

  updateTitle(sessionId: string, title: string): void {
    const session = ConversationMemory.get(sessionId);
    if (session) {
      session.title = title;
      ConversationMemory.save(session);
    }
  },
};
