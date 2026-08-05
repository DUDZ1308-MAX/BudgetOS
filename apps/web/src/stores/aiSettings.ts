import { create } from 'zustand';
import type { AiProviderName, AiProviderConfig, ConnectionStatus, ProviderSetup } from '@/ai/types';
import { getDefaultConfig, getSupportedProviders, testProviderConnection } from '@/ai/AiProvider';

const STORAGE_KEY_ACTIVE = 'budgetos_ai_active_provider';
const STORAGE_KEY_STATUS = 'budgetos_ai_connection_status';
const STORAGE_KEY_TESTED = 'budgetos_ai_last_tested';
const STORAGE_KEY_MODELS = 'budgetos_ai_models';

const GATEWAY_URL = 'https://lhkytairslljxlkguhsp.supabase.co/functions/v1/ai-gateway';

const DEFAULT_PROVIDER_SETUPS: Record<AiProviderName, ProviderSetup> = {
  groq: { model: 'llama-3.3-70b-versatile', baseUrl: GATEWAY_URL },
  gemini: { model: 'gemini-2.0-flash', baseUrl: GATEWAY_URL },
  openai: { model: 'gpt-4o-mini', baseUrl: GATEWAY_URL },
  deepseek: { model: 'deepseek-chat', baseUrl: GATEWAY_URL },
  ollama: { model: 'llama3', baseUrl: 'http://localhost:11434' },
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
  updateProviderModel: (name: AiProviderName, model: string) => void;
  setConnectionStatus: (name: AiProviderName, status: ConnectionStatus) => void;
  setLastTested: (name: AiProviderName, timestamp: string) => void;
  runTestConnection: (name: AiProviderName) => Promise<{ success: boolean; message: string }>;
  load: () => void;
  reset: () => void;
}

export const useAiSettingsStore = create<AiSettingsState>((set, get) => ({
  provider: 'groq',
  config: getDefaultConfig('groq'),
  providers: getSupportedProviders(),
  initialized: false,

  providerSetups: { ...DEFAULT_PROVIDER_SETUPS },
  connectionStatus: { groq: 'unknown', gemini: 'unknown', openai: 'unknown', deepseek: 'unknown', ollama: 'unknown' },
  lastTested: { groq: null, gemini: null, openai: null, deepseek: null, ollama: null },
  testingProvider: null,

  setProvider: (name) => {
    const setups = get().providerSetups;
    const setup = setups[name] ?? DEFAULT_PROVIDER_SETUPS[name];
    const config: AiProviderConfig = {
      model: setup.model,
      temperature: get().config.temperature,
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
    set({ providerSetups: setups });
    saveToStorage(STORAGE_KEY_MODELS, Object.fromEntries(Object.entries(setups).map(([k, v]) => [k, v.model])));
  },

  updateProviderModel: (name, model) => {
    const setups = { ...get().providerSetups };
    setups[name] = { ...setups[name], model };
    set({ providerSetups: setups });
    saveToStorage(STORAGE_KEY_MODELS, Object.fromEntries(Object.entries(setups).map(([k, v]) => [k, v.model])));

    if (name === get().provider) {
      set({ config: { ...get().config, model } });
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
    const activeProvider = loadFromStorage<AiProviderName>(STORAGE_KEY_ACTIVE, 'groq');
    const savedStatus = loadFromStorage<Record<AiProviderName, ConnectionStatus>>(STORAGE_KEY_STATUS, {
      groq: 'unknown', gemini: 'unknown', openai: 'unknown', deepseek: 'unknown', ollama: 'unknown',
    });
    const savedTested = loadFromStorage<Record<AiProviderName, string | null>>(STORAGE_KEY_TESTED, {
      groq: null, gemini: null, openai: null, deepseek: null, ollama: null,
    });
    const savedModels = loadFromStorage<Record<string, string>>(STORAGE_KEY_MODELS, {});

    const provider = getSupportedProviders().includes(activeProvider) ? activeProvider : 'groq';

    const setups = { ...DEFAULT_PROVIDER_SETUPS };
    for (const [key, model] of Object.entries(savedModels)) {
      if (key in setups) {
        setups[key as AiProviderName] = { ...setups[key as AiProviderName], model };
      }
    }

    const setup = setups[provider];
    const config: AiProviderConfig = {
      ...getDefaultConfig(provider),
      model: setup.model,
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
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
      localStorage.removeItem(STORAGE_KEY_STATUS);
      localStorage.removeItem(STORAGE_KEY_TESTED);
      localStorage.removeItem(STORAGE_KEY_MODELS);
      localStorage.removeItem('budgetos_ai_provider_configs');
    } catch {
      // ignore
    }
    set({
      provider: 'groq',
      config: getDefaultConfig('groq'),
      providerSetups: { ...DEFAULT_PROVIDER_SETUPS },
      connectionStatus: { groq: 'unknown', gemini: 'unknown', openai: 'unknown', deepseek: 'unknown', ollama: 'unknown' },
      lastTested: { groq: null, gemini: null, openai: null, deepseek: null, ollama: null },
    });
  },
}));
