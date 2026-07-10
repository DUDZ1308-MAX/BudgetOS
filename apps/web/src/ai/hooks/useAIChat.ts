import { useState, useEffect, useCallback, useRef } from 'react';
import { useAiSettingsStore } from '@/stores/aiSettings';
import { AiService, ChatHistory } from '@/ai/AiService';
import { AiClient } from '@/ai/services/aiClient';
import type { AiContext, ChatSession, AiProviderName, AiProviderConfig } from '@/ai/types';

interface UseAIChatOptions {
  context: AiContext | null;
  userId?: string;
}

interface UseAIChatReturn {
  session: ChatSession;
  sessions: ChatSession[];
  input: string;
  setInput: (val: string) => void;
  isTyping: boolean;
  isCancelled: boolean;
  sendMessage: (message?: string) => Promise<void>;
  cancelRequest: () => void;
  newChat: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  togglePin: (id: string) => void;
}

export function useAIChat({ context }: UseAIChatOptions): UseAIChatReturn {
  const { provider, config } = useAiSettingsStore();
  const [session, setSession] = useState<ChatSession>(() => ChatHistory.createSession());
  const [sessions, setSessions] = useState<ChatSession[]>(() => ChatHistory.getAllSessions());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const aiServiceRef = useRef<AiService | null>(null);
  const aiClientRef = useRef<AiClient | null>(null);
  const sessionRef = useRef<ChatSession>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    aiServiceRef.current = new AiService(provider, config);
  }, [provider, config]);

  const sendMessage = useCallback(async (message?: string) => {
    const text = (message ?? input).trim();
    if (!text || !context || !aiServiceRef.current) return;

    setInput('');
    setIsTyping(true);
    setIsCancelled(false);

    const currentSession = sessionRef.current;
    let accumulatedContent = '';

    const tempSession: ChatSession = {
      ...currentSession,
      messages: [
        ...currentSession.messages,
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: '' },
      ],
    };
    setSession(tempSession);

    try {
      const result = await aiServiceRef.current.sendMessage(
        currentSession,
        text,
        context,
        (chunk) => {
          accumulatedContent += chunk;
          setSession((prev) => ({
            ...prev,
            messages: prev.messages.map((m, i) =>
              i === prev.messages.length - 1
                ? { ...m, content: accumulatedContent }
                : m,
            ),
          }));
        },
      );

      setSession((prev) => ({
        ...prev,
        messages: prev.messages.map((m, i) =>
          i === prev.messages.length - 1
            ? { role: 'assistant' as const, content: result }
            : m,
        ),
      }));

      setSessions(ChatHistory.getAllSessions());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';

      if (errorMsg === 'Request cancelled') {
        setIsCancelled(true);
        const partialContent = accumulatedContent || '(Cancelled)';
        currentSession.messages.push({ role: 'assistant', content: partialContent });
        ChatHistory.addMessage(currentSession.id, { role: 'assistant', content: partialContent });
      } else {
        currentSession.messages.push({ role: 'assistant', content: `Error: ${errorMsg}` });
        ChatHistory.addMessage(currentSession.id, { role: 'assistant', content: `Error: ${errorMsg}` });
      }

      setSession({ ...currentSession });
      setSessions(ChatHistory.getAllSessions());
    } finally {
      setIsTyping(false);
      aiClientRef.current = null;
    }
  }, [input, context]);

  const cancelRequest = useCallback(() => {
    aiClientRef.current?.cancel();
    setIsCancelled(true);
  }, []);

  const newChat = useCallback(() => {
    const newSession = ChatHistory.createSession();
    setSession(newSession);
    setInput('');
    setSessions(ChatHistory.getAllSessions());
    setIsCancelled(false);
  }, []);

  const selectSession = useCallback((id: string) => {
    const s = ChatHistory.getSession(id);
    if (s) {
      setSession(s);
      setIsCancelled(false);
    }
  }, []);

  const deleteSession = useCallback((id: string) => {
    ChatHistory.deleteSession(id);
    setSessions(ChatHistory.getAllSessions());
    if (session.id === id) {
      newChat();
    }
  }, [session.id, newChat]);

  const togglePin = useCallback((id: string) => {
    ChatHistory.togglePin(id);
    setSessions(ChatHistory.getAllSessions());
    if (session.id === id) {
      const updated = ChatHistory.getSession(id);
      if (updated) setSession(updated);
    }
  }, [session.id]);

  return {
    session,
    sessions,
    input,
    setInput,
    isTyping,
    isCancelled,
    sendMessage,
    cancelRequest,
    newChat,
    selectSession,
    deleteSession,
    togglePin,
  };
}
