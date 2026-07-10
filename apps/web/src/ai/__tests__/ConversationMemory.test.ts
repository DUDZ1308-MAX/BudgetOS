import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationMemory } from '@/ai/ConversationMemory';
import { ChatHistory } from '@/ai/ChatHistory';

describe('ConversationMemory', () => {
  beforeEach(() => {
    ConversationMemory.clearAll();
  });

  it('creates a new conversation', () => {
    const conv = ConversationMemory.create('Test Chat');
    expect(conv.id).toBeTruthy();
    expect(conv.title).toBe('Test Chat');
    expect(conv.messages).toEqual([]);
    expect(conv.pinned).toBe(false);
  });

  it('saves and retrieves a conversation', () => {
    const conv = ConversationMemory.create('Saved Chat');
    ConversationMemory.save(conv);

    const all = ConversationMemory.getAll();
    expect(all.length).toBe(1);
    expect(all[0]!.title).toBe('Saved Chat');
  });

  it('adds messages to a conversation', () => {
    const conv = ConversationMemory.create('Chat');
    ConversationMemory.save(conv);

    ConversationMemory.addMessage(conv.id, { role: 'user', content: 'Hello' });
    ConversationMemory.addMessage(conv.id, { role: 'assistant', content: 'Hi there' });

    const loaded = ConversationMemory.get(conv.id)!;
    expect(loaded.messages.length).toBe(2);
    expect(loaded.messages[0]!.content).toBe('Hello');
    expect(loaded.messages[1]!.content).toBe('Hi there');
  });

  it('deletes a conversation', () => {
    const conv = ConversationMemory.create('To Delete');
    ConversationMemory.save(conv);
    expect(ConversationMemory.getAll().length).toBe(1);

    ConversationMemory.delete(conv.id);
    expect(ConversationMemory.getAll().length).toBe(0);
  });

  it('toggles pin status', () => {
    const conv = ConversationMemory.create('Pin Test');
    ConversationMemory.save(conv);

    ConversationMemory.togglePin(conv.id);
    const loaded2 = ConversationMemory.get(conv.id)!;
    expect(loaded2.pinned).toBe(true);

    ConversationMemory.togglePin(conv.id);
    expect(ConversationMemory.get(conv.id)?.pinned).toBe(false);
  });

  it('returns null for non-existent conversation', () => {
    const result = ConversationMemory.get('non-existent');
    expect(result).toBeNull();
  });

  it('clears all conversations', () => {
    const c1 = ConversationMemory.create('Chat 1');
    ConversationMemory.save(c1);
    const c2 = ConversationMemory.create('Chat 2');
    ConversationMemory.save(c2);
    expect(ConversationMemory.getAll().length).toBeGreaterThan(0);

    ConversationMemory.clearAll();
    expect(ConversationMemory.getAll().length).toBe(0);
  });
});

describe('ChatHistory', () => {
  beforeEach(() => {
    ConversationMemory.clearAll();
  });

  it('creates and saves a session', () => {
    const session = ChatHistory.createSession('My Chat');
    ChatHistory.saveSession(session);

    const sessions = ChatHistory.getAllSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0]!.title).toBe('My Chat');
  });

  it('retrieves a session by id', () => {
    const session = ChatHistory.createSession('Test');
    ChatHistory.saveSession(session);

    const loaded2 = ConversationMemory.get(session.id)!;
    expect(loaded2.title).toBe('Test');
  });

  it('adds messages to a session', () => {
    const session = ChatHistory.createSession('Test');
    ChatHistory.saveSession(session);

    ChatHistory.addMessage(session.id, { role: 'user', content: 'Test message' });

    const loaded3 = ChatHistory.getSession(session.id)!;
    expect(loaded3.messages.length).toBe(1);
    expect(loaded3.messages[0]!.content).toBe('Test message');
  });

  it('updates session title', () => {
    const session = ChatHistory.createSession('Old Title');
    ChatHistory.saveSession(session);

    ChatHistory.updateTitle(session.id, 'New Title');

    const loaded4 = ChatHistory.getSession(session.id)!;
    expect(loaded4.title).toBe('New Title');
  });

  it('deletes a session', () => {
    const session = ChatHistory.createSession('To Delete');
    ChatHistory.saveSession(session);

    ChatHistory.deleteSession(session.id);
    expect(ChatHistory.getAllSessions().length).toBe(0);
  });
});
