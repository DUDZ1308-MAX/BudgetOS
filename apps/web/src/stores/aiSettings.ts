import { create } from 'zustand';
import type { AiProviderName, AiProviderConfig, ConnectionStatus, ProviderSetup } from '@/ai/types';
import { getDefaultConfig, getSupportedProviders, testProviderConnection } from '@/ai/AiProvider';

// WARNING: API keys are stored in localStorage, which is accessible to any JS running on the page.
// For a client-only app this is acceptable, but keys should NEVER be logged, sent to third-party
// analytics, or embedded in source code. Consider using a server-side proxy for production deployments.

const STORAGE_KEY_CONFIG = 'budgetos_ai_provider_configs';
const STORAGE_KEY_ACTIVE = 'budgetos_ai_active_provider';
const STORAGE_KEY_STATUS = 'budgetos_ai_connection_status';
const STORAGE_KEY_TESTED = 'budgetos_ai_last_tested';

const DEFAULT_PROVIDER_SETUPS: Record<AiProviderName, ProviderSetup> = {
  openai: { model: 'gpt-4o-mini', apiKey: '', baseUrl: 'https://api.openai.com/v1' },
  deepseek: { model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com/v1' },
  ollama: { model: 'llama3', apiKey: '', baseUrl: 'http://localhost:11434' },
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface AiSettingsState {
  provider: AiProviderName;
  config: AiProviderConfig;
  providers: AiProviderName[];
  initialized: boolean;

  providerSetups: Record<AiProviderName, ProviderSetup>;
  connectionStatus: Record<AiProviderName, ConnectionStatus>;
  lastTested: Record<AiProviderName, string | null>;
  testingProvider: AiProviderName | null;

  setProvider: (name: AiProviderName) => void;
  updateConfig: (partial: Partial<AiProviderConfig>) => void;
  updateProviderSetup: (name: AiProviderName, setup: Partial<ProviderSetup>) => void;
  setConnectionStatus: (name: AiProviderName, status: ConnectionStatus) => void;
  setLastTested: (name: AiProviderName, timestamp: string) => void;
  runTestConnection: (name: AiProviderName) => Promise<{ success: boolean; message: string }>;
  getStoredApiKey: () => string;
  load: () => void;
  reset: () => void;
}

export const useAiSettingsStore = create<AiSettingsState>((set, get) => ({
  provider: 'openai',
  config: getDefaultConfig('openai'),
  providers: getSupportedProviders(),
  initialized: false,

  providerSetups: { ...DEFAULT_PROVIDER_SETUPS },
  connectionStatus: { openai: 'unknown', deepseek: 'unknown', ollama: 'unknown' },
  lastTested: { openai: null, deepseek: null, ollama: null },
  testingProvider: null,

  getStoredApiKey: () => {
    try {
      const setups = loadFromStorage<Record<AiProviderName, ProviderSetup>>(STORAGE_KEY_CONFIG, DEFAULT_PROVIDER_SETUPS);
      const active = get().provider;
      return setups[active]?.apiKey ?? '';
    } catch {
      return '';
    }
  },

  setProvider: (name) => {
    const setups = get().providerSetups;
    const setup = setups[name] ?? DEFAULT_PROVIDER_SETUPS[name];
    const config: AiProviderConfig = {
      model: setup.model,
      temperature: get().config.temperature,
      apiKey: setup.apiKey,
      baseUrl: setup.baseUrl,
      streaming: get().config.streaming,
      maxTokens: get().config.maxTokens,
    };
    set({ provider: name, config });
    saveToStorage(STORAGE_KEY_ACTIVE, name);
  },

  updateConfig: (partial) => {
    const current = get().config;
    const updated = { ...current, ...partial };
    set({ config: updated });

    const name = get().provider;
    const setups = { ...get().providerSetups };
    if (partial.model !== undefined) setups[name] = { ...setups[name], model: partial.model };
    if (partial.apiKey !== undefined) setups[name] = { ...setups[name], apiKey: partial.apiKey };
    if (partial.baseUrl !== undefined) setups[name] = { ...setups[name], baseUrl: partial.baseUrl };
    set({ providerSetups: setups });
    saveToStorage(STORAGE_KEY_CONFIG, setups);
  },

  updateProviderSetup: (name, setup) => {
    const setups = { ...get().providerSetups };
    setups[name] = { ...setups[name], ...setup };
    set({ providerSetups: setups });
    saveToStorage(STORAGE_KEY_CONFIG, setups);

    if (name === get().provider) {
      const configUpdated: Partial<AiProviderConfig> = {};
      if (setup.model !== undefined) configUpdated.model = setup.model;
      if (setup.apiKey !== undefined) configUpdated.apiKey = setup.apiKey;
      if (setup.baseUrl !== undefined) configUpdated.baseUrl = setup.baseUrl;
      if (Object.keys(configUpdated).length > 0) {
        get().updateConfig(configUpdated);
      }
    }
  },

  setConnectionStatus: (name, status) => {
    const current = { ...get().connectionStatus };
    current[name] = status;
    set({ connectionStatus: current });
    saveToStorage(STORAGE_KEY_STATUS, current);
  },

  setLastTested: (name, timestamp) => {
    const current = { ...get().lastTested };
    current[name] = timestamp;
    set({ lastTested: current });
    saveToStorage(STORAGE_KEY_TESTED, current);
  },

  runTestConnection: async (name) => {
    set({ testingProvider: name });
    const setup = get().providerSetups[name] ?? DEFAULT_PROVIDER_SETUPS[name];
    const config: AiProviderConfig = {
      model: setup.model,
      apiKey: setup.apiKey,
      baseUrl: setup.baseUrl,
      temperature: 0.7,
    };

    try {
      const result = await testProviderConnection(name, config);
      get().setConnectionStatus(name, result.success ? 'connected' : 'failed');
      if (result.success) {
        get().setLastTested(name, new Date().toISOString());
      }
      return result;
    } catch (err) {
      get().setConnectionStatus(name, 'failed');
      return { success: false, message: err instanceof Error ? err.message : 'Connection test failed' };
    } finally {
      set({ testingProvider: null });
    }
  },

  load: () => {
    const setups = loadFromStorage<Record<AiProviderName, ProviderSetup>>(STORAGE_KEY_CONFIG, DEFAULT_PROVIDER_SETUPS);
    const activeProvider = loadFromStorage<AiProviderName>(STORAGE_KEY_ACTIVE, 'openai');
    const savedStatus = loadFromStorage<Record<AiProviderName, ConnectionStatus>>(STORAGE_KEY_STATUS, {
      openai: 'unknown', deepseek: 'unknown', ollama: 'unknown',
    });
    const savedTested = loadFromStorage<Record<AiProviderName, string | null>>(STORAGE_KEY_TESTED, {
      openai: null, deepseek: null, ollama: null,
    });

    const provider = getSupportedProviders().includes(activeProvider) ? activeProvider : 'openai';
    const setup = setups[provider] ?? DEFAULT_PROVIDER_SETUPS[provider];

    const config: AiProviderConfig = {
      ...getDefaultConfig(provider),
      model: setup.model,
      apiKey: setup.apiKey,
      baseUrl: setup.baseUrl,
    };

    set({
      provider,
      config,
      providerSetups: setups,
      connectionStatus: savedStatus,
      lastTested: savedTested,
      initialized: true,
    });
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
      localStorage.removeItem(STORAGE_KEY_STATUS);
      localStorage.removeItem(STORAGE_KEY_TESTED);
    } catch {
      // ignore
    }
    set({
      provider: 'openai',
      config: getDefaultConfig('openai'),
      providerSetups: { ...DEFAULT_PROVIDER_SETUPS },
      connectionStatus: { openai: 'unknown', deepseek: 'unknown', ollama: 'unknown' },
      lastTested: { openai: null, deepseek: null, ollama: null },
    });
  },
}));
