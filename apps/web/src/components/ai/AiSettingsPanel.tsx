import { useState, useCallback } from 'react';
import { useAiSettingsStore } from '@/stores/aiSettings';
import { ApiKeyGuide } from './ApiKeyGuide';
import type { AiProviderName, ConnectionStatus, ProviderSetup } from '@/ai/types';

interface AiSettingsPanelProps {
  onClose: () => void;
}

const PROVIDER_META: Record<AiProviderName, { name: string; icon: string; description: string; requiresKey: boolean }> = {
  openai: { name: 'OpenAI', icon: '⚡', description: 'Premium cloud AI — GPT-4o and more', requiresKey: true },
  deepseek: { name: 'DeepSeek', icon: '🔍', description: 'Low-cost cloud AI — competitive quality', requiresKey: true },
  ollama: { name: 'Ollama', icon: '🦙', description: 'Free & private — runs 100% locally', requiresKey: false },
};

const PROVIDER_RECOMMENDATIONS: AiProviderName[] = ['ollama', 'deepseek', 'openai'];

function isConfigured(name: AiProviderName, setups: Record<AiProviderName, ProviderSetup>): boolean {
  if (name === 'ollama') return true;
  const setup = setups[name];
  return !!setup.apiKey;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
}

export function AiSettingsPanel({ onClose }: AiSettingsPanelProps) {
  const {
    provider: activeProvider,
    config,
    providerSetups,
    connectionStatus,
    lastTested,
    testingProvider,
    setProvider,
    updateProviderSetup,
    runTestConnection,
    reset,
  } = useAiSettingsStore();

  const [guideProvider, setGuideProvider] = useState<AiProviderName | null>(null);
  const [testResults, setTestResults] = useState<Record<AiProviderName, { success: boolean; message: string } | null>>({} as Record<AiProviderName, { success: boolean; message: string } | null>);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<AiProviderName, boolean>>({} as Record<AiProviderName, boolean>);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleTestConnection = useCallback(async (name: AiProviderName) => {
    setTestResults((prev) => ({ ...prev, [name]: null }));
    const result = await runTestConnection(name);
    setTestResults((prev) => ({ ...prev, [name]: result }));
  }, [runTestConnection]);

  const anyConfigured = Object.keys(PROVIDER_META).some((k) =>
    isConfigured(k as AiProviderName, providerSetups)
  );

  const anyKeyProvider = (Object.keys(PROVIDER_META) as AiProviderName[]).filter((k) => PROVIDER_META[k].requiresKey);

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Settings</h2>
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          Close
        </button>
      </div>

      {!anyConfigured && (
        <WelcomeCard />
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          AI Providers
        </h3>

        {(Object.keys(PROVIDER_META) as AiProviderName[]).map((name) => {
          const meta = PROVIDER_META[name];
          const setup = providerSetups[name];
          const status = connectionStatus[name];
          const tested = lastTested[name];
          const configured = isConfigured(name, providerSetups);
          const isActive = name === activeProvider;
          const isTesting = testingProvider === name;
          const testResult = testResults[name];
          const keyVisible = showApiKey[name];

          return (
            <div
              key={name}
              className={`rounded-xl border-2 p-4 transition-all ${
                isActive
                  ? 'border-brand-400 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/10'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProvider(name)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isActive
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isActive && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{meta.name}</span>
                      {isActive && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                          Active
                        </span>
                      )}
                      <StatusDot configured={configured} status={status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{meta.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Model</label>
                  <input
                    type="text"
                    value={setup.model}
                    onChange={(e) => updateProviderSetup(name, { model: e.target.value })}
                    placeholder={name === 'openai' ? 'gpt-4o-mini' : name === 'deepseek' ? 'deepseek-chat' : 'llama3'}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {meta.requiresKey ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">API Key</label>
                    <div className="relative mt-1">
                      <input
                        type={keyVisible ? 'text' : 'password'}
                        value={setup.apiKey}
                        onChange={(e) => updateProviderSetup(name, { apiKey: e.target.value })}
                        placeholder={`${meta.name} API key`}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-20 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setShowApiKey((prev) => ({ ...prev, [name]: !prev[name] }))}
                          className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title={keyVisible ? 'Hide key' : 'Show key'}
                        >
                          {keyVisible ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        {setup.apiKey && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(setup.apiKey).catch(() => {});
                            }}
                            className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="Copy key"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) updateProviderSetup(name, { apiKey: text });
                            } catch {
                              // Clipboard read denied
                            }
                          }}
                          className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Paste from clipboard"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProviderSetup(name, { apiKey: '' })}
                          className="rounded p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                          title="Clear key"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Base URL</label>
                    <input
                      type="text"
                      value={setup.baseUrl}
                      onChange={(e) => updateProviderSetup(name, { baseUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              {meta.requiresKey && (
                <div className="mt-3">
                  <button
                    onClick={() => setGuideProvider(name)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    How do I get an API key?
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleTestConnection(name)}
                  disabled={isTesting || (!meta.requiresKey && !setup.baseUrl)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {isTesting ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Test Connection
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`flex items-center gap-1.5 text-xs ${
                    testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {testResult.success ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{testResult.success ? 'Connected' : 'Connection Failed'}</span>
                  </div>
                )}

                {testResult && !testResult.success && (
                  <p className="w-full text-xs text-red-500 dark:text-red-400">{testResult.message}</p>
                )}

                {tested && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Last tested: {formatTimestamp(tested)}
                  </span>
                )}

                {status === 'connected' && !testResult && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                    {tested && <span className="text-[10px] text-slate-400">({formatTimestamp(tested)})</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Global Settings
        </h3>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Temperature</label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => {
                const { updateConfig } = useAiSettingsStore.getState();
                updateConfig({ temperature: parseFloat(e.target.value) });
              }}
              className="flex-1"
            />
            <span className="w-8 text-right text-sm text-slate-600 dark:text-slate-300">{config.temperature.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.streaming ?? true}
              onChange={(e) => {
                const { updateConfig } = useAiSettingsStore.getState();
                updateConfig({ streaming: e.target.checked });
              }}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            Streaming responses
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
        >
          Reset
        </button>
      </div>

      {guideProvider && (
        <ApiKeyGuide provider={guideProvider} onClose={() => setGuideProvider(null)} />
      )}
    </div>
  );
}

function StatusDot({ configured, status }: { configured: boolean; status: ConnectionStatus }) {
  const color = status === 'connected'
    ? 'bg-emerald-500'
    : configured
      ? 'bg-amber-400'
      : 'bg-slate-300 dark:bg-slate-600';

  const label = status === 'connected'
    ? 'Connected'
    : configured
      ? 'Configured'
      : 'Not Configured';

  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-400">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function WelcomeCard() {
  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-brand-800 dark:from-brand-950 dark:to-slate-900">
      <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
        Welcome to AI Copilot
      </h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Your personal financial assistant. Ask questions about your spending, get budget insights,
        forecast future balances, and receive personalized recommendations — all powered by AI.
      </p>

      <div className="mb-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supported providers:</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROVIDER_META) as AiProviderName[]).map((name) => {
            const meta = PROVIDER_META[name];
            return (
              <div
                key={name}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm dark:bg-slate-800"
              >
                <span>{meta.icon}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{meta.name}</span>
                <span className="text-slate-400">— {meta.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-white p-3 dark:bg-slate-800">
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Recommendations:</p>
        <ol className="space-y-1.5">
          {PROVIDER_RECOMMENDATIONS.map((name, i) => {
            const meta = PROVIDER_META[name];
            return (
              <li key={name} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {i + 1}
                </span>
                <span className="font-medium">{meta.name}</span>
                <span className="text-xs text-slate-400">— {meta.description}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
