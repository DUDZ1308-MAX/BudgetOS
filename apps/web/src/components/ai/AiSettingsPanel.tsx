import { useState, useCallback } from 'react';
import { useAiSettingsStore } from '@/stores/aiSettings';
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
    updateProviderModel,
    runTestConnection,
    reset,
  } = useAiSettingsStore();

  const [testResults, setTestResults] = useState<Record<AiProviderName, { success: boolean; message: string } | null>>({} as Record<AiProviderName, { success: boolean; message: string } | null>);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleTestConnection = useCallback(async (name: AiProviderName) => {
    setTestResults((prev) => ({ ...prev, [name]: null }));
    const result = await runTestConnection(name);
    setTestResults((prev) => ({ ...prev, [name]: result }));
  }, [runTestConnection]);

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

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          API keys are managed securely on the server. Select a provider and model below — no keys needed in the browser.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          AI Providers
        </h3>

        {(Object.keys(PROVIDER_META) as AiProviderName[]).map((name) => {
          const meta = PROVIDER_META[name];
          const setup = providerSetups[name];
          const status = connectionStatus[name];
          const tested = lastTested[name];
          const isActive = name === activeProvider;
          const isTesting = testingProvider === name;
          const testResult = testResults[name];

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
                    onChange={(e) => updateProviderModel(name, e.target.value)}
                    placeholder={name === 'openai' ? 'gpt-4o-mini' : name === 'deepseek' ? 'deepseek-chat' : 'llama3'}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Base URL</label>
                  <input
                    type="text"
                    value={setup.baseUrl}
                    disabled={!meta.requiresKey}
                    placeholder={name === 'ollama' ? 'http://localhost:11434' : 'Managed by gateway'}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleTestConnection(name)}
                  disabled={isTesting}
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
    </div>
  );
}
