import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useAiSettingsStore } from '@/stores/aiSettings';
import { useUsageStore } from '@/stores/usage';
import { useAiUsageGuard } from '@/hooks/useUsageLimits';
import { useSubscriptionStore } from '@/stores/subscription';
import { AiService, ChatHistory } from '@/ai/AiService';
import { generateEnhancedInsights, computeCashFlowForecast } from '@/ai/InsightEngine';
import { generateRecommendations } from '@/ai/RecommendationEngine';
import { generateForecasts } from '@/ai/ForecastEngine';
import { buildAiContext } from '@/services/ai/FinanceContext';
import { ChatWindow } from '@/components/ai/ChatWindow';
import { SuggestionChips } from '@/components/ai/SuggestionChips';
import { InsightCards } from '@/components/ai/InsightCards';
import { ForecastCards } from '@/components/ai/ForecastCards';
import { RecommendationCards } from '@/components/ai/RecommendationCards';
import { AiSettingsPanel } from '@/components/ai/AiSettingsPanel';
import { UpgradePrompt } from '@/billing/billingGuard';
import type { AiContext, ChatSession } from '@/ai/types';

type AiTab = 'chat' | 'insights' | 'forecasts' | 'recommendations';

export function AiPage() {
  const { user } = useAuthStore();
  const { provider, config, initialized, load } = useAiSettingsStore();
  const track = useUsageStore((s) => s.track);
  const { isExhausted, remaining, aiUsage, aiLimit } = useAiUsageGuard();
  const tier = useSubscriptionStore((s) => s.tier);
  const [activeTab, setActiveTab] = useState<AiTab>('chat');
  const [session, setSession] = useState<ChatSession>(() => ChatHistory.createSession());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<AiContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const aiServiceRef = useRef<AiService | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    aiServiceRef.current = new AiService(provider, config);
  }, [provider, config]);

  useEffect(() => {
    setSessions(ChatHistory.getAllSessions());
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    buildAiContext(user.id)
      .then((ctx) => {
        setContext(ctx);
      })
      .catch((err) => {
        console.error('Failed to build AI context:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSend = useCallback(async (message?: string) => {
    const text = (message ?? input).trim();
    if (!text || !context || !aiServiceRef.current) return;

    if (isExhausted) return;

    setInput('');
    setIsTyping(true);
    track('ai_request');

    try {
      await aiServiceRef.current.sendMessage(session, text, context, (_chunk) => {
        // streaming - could update as we go
      });
      setSession({ ...session });
      setSessions(ChatHistory.getAllSessions());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      session.messages.push({ role: 'assistant', content: `Error: ${errorMsg}` });
      ChatHistory.addMessage(session.id, { role: 'assistant', content: `Error: ${errorMsg}` });
      setSession({ ...session });
    } finally {
      setIsTyping(false);
    }
  }, [input, context, session, isExhausted, track]);

  const handleNewChat = useCallback(() => {
    const newSession = ChatHistory.createSession();
    setSession(newSession);
    setInput('');
    setSessions(ChatHistory.getAllSessions());
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    const s = ChatHistory.getSession(id);
    if (s) {
      setSession(s);
      setShowHistory(false);
    }
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    ChatHistory.deleteSession(id);
    setSessions(ChatHistory.getAllSessions());
    if (session.id === id) {
      handleNewChat();
    }
  }, [session.id, handleNewChat]);

  const handleTogglePin = useCallback((id: string) => {
    ChatHistory.togglePin(id);
    setSessions(ChatHistory.getAllSessions());
    if (session.id === id) {
      const updated = ChatHistory.getSession(id);
      if (updated) setSession(updated);
    }
  }, [session.id]);

  const enhancedInsights = context ? generateEnhancedInsights(context) : [];
  const forecasts = context ? [...computeCashFlowForecast(context, 3), ...generateForecasts(context, 3)] : [];
  const recommendations = context ? generateRecommendations(context) : [];

  const pendingCount = sessions.filter((s) => s.id !== session.id).length;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Copilot</h1>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {(['chat', 'insights', 'forecasts', 'recommendations'] as AiTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'chat' && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                >
                  History ({pendingCount})
                </button>
                <button
                  onClick={handleNewChat}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  New Chat
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
            >
              Settings
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="mb-4">
            <AiSettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        )}

        {showHistory && activeTab === 'chat' && (
          <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No previous conversations</p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      s.id === session.id ? 'bg-slate-50 dark:bg-slate-800' : ''
                    }`}
                  >
                    <button onClick={() => handleSelectSession(s.id)} className="flex-1 text-left">
                      <span className="text-slate-900 dark:text-white">{s.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleTogglePin(s.id)} className="text-xs text-slate-400 hover:text-amber-500">
                        {s.pinned ? '★' : '☆'}
                      </button>
                      <button onClick={() => handleDeleteSession(s.id)} className="text-xs text-slate-400 hover:text-red-500">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tier === 'free' && aiLimit !== undefined && (
          <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                AI Requests: <span className="font-medium text-slate-700 dark:text-slate-300">{aiUsage}</span> / {aiLimit} this month
              </span>
              {remaining === 0 ? (
                <span className="font-medium text-red-500">Limit reached</span>
              ) : (
                <span className="text-slate-400">{remaining} remaining</span>
              )}
            </div>
            <div className="h-1 bg-slate-100 dark:bg-slate-700">
              <div
                className={`h-full transition-all ${
                  aiLimit > 0 && aiUsage / aiLimit >= 0.8
                    ? 'bg-red-500'
                    : aiLimit > 0 && aiUsage / aiLimit >= 0.5
                      ? 'bg-amber-500'
                      : 'bg-brand-500'
                }`}
                style={{ width: `${aiLimit > 0 ? Math.min((aiUsage / aiLimit) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">Loading your financial data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <ChatWindow messages={session.messages} isTyping={isTyping} />
                {session.messages.length === 0 && !isExhausted && (
                  <SuggestionChips onSelect={handleSend} disabled={isTyping} />
                )}
                {isExhausted ? (
                  <div className="p-4">
                    <UpgradePrompt variant="banner" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask about your finances..."
                      disabled={isTyping || !context}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isTyping || !context}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <InsightCards insights={enhancedInsights} />
              </div>
            )}

            {activeTab === 'forecasts' && (
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <ForecastCards forecasts={forecasts} />
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <RecommendationCards recommendations={recommendations} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
