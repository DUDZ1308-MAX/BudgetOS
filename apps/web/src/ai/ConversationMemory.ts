import type { AiMessage } from '@/ai/types';

interface StoredConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

const STORAGE_KEY = 'budgetos_ai_conversations';
const MAX_CONVERSATIONS = 50;

function loadAll(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(conversations: StoredConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // storage full — silently fail
  }
}

function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ConversationMemory = {
  create(title: string): StoredConversation {
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

  save(conversation: StoredConversation): void {
    const all = loadAll();
    const idx = all.findIndex((c) => c.id === conversation.id);
    const updated = { ...conversation, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.push(updated);
    }
    saveAll(all);
  },

  delete(id: string): void {
    const all = loadAll().filter((c) => c.id !== id);
    saveAll(all);
  },

  get(id: string): StoredConversation | null {
    return loadAll().find((c) => c.id === id) ?? null;
  },

  getAll(): StoredConversation[] {
    return loadAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  togglePin(id: string): void {
    const all = loadAll();
    const conv = all.find((c) => c.id === id);
    if (conv) {
      conv.pinned = !conv.pinned;
      saveAll(all);
    }
  },

  addMessage(conversationId: string, message: AiMessage): void {
    const all = loadAll();
    const conv = all.find((c) => c.id === conversationId);
    if (conv) {
      conv.messages.push(message);
      conv.updatedAt = new Date().toISOString();
      saveAll(all);
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
