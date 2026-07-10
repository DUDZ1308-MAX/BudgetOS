import { create } from 'zustand';

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  group: 'experimental' | 'beta' | 'premium-preview' | 'ab-test';
}

export interface FeatureFlagOverride {
  flagKey: string;
  enabled: boolean;
}

interface FeatureFlagsState {
  flags: FeatureFlag[];
  overrides: FeatureFlagOverride[];
  isEnabled: (key: string) => boolean;
  setOverride: (key: string, enabled: boolean) => void;
  resetOverrides: () => void;
}

const defaultFlags: FeatureFlag[] = [
  { key: 'new-dashboard', label: 'New Dashboard Layout', description: 'Enhanced dashboard with reorganized widgets', defaultEnabled: false, group: 'experimental' },
  { key: 'ai-insights-v2', label: 'AI Insights v2', description: 'Next-generation AI-powered financial insights', defaultEnabled: false, group: 'experimental' },
  { key: 'advanced-analytics', label: 'Advanced Analytics', description: 'Deeper financial analytics and trend visualization', defaultEnabled: false, group: 'beta' },
  { key: 'mortgage-refinance', label: 'Mortgage Refinance Calculator', description: 'Compare refinancing options for your mortgage', defaultEnabled: false, group: 'beta' },
  { key: 'premium-reports', label: 'Premium Report Templates', description: 'Preview of premium report templates', defaultEnabled: false, group: 'premium-preview' },
  { key: 'import-plaid', label: 'Plaid Integration (Coming Soon)', description: 'Auto-import transactions via Plaid', defaultEnabled: false, group: 'premium-preview' },
  { key: 'onboarding-v2', label: 'Onboarding v2 Test', description: 'Testing new onboarding flow', defaultEnabled: false, group: 'ab-test' },
  { key: 'goal-projection', label: 'Goal Projection', description: 'Enhanced savings goal projections with AI', defaultEnabled: false, group: 'ab-test' },
];

function loadOverrides(): FeatureFlagOverride[] {
  try {
    const raw = localStorage.getItem('budgetos_feature_overrides');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOverrides(overrides: FeatureFlagOverride[]) {
  localStorage.setItem('budgetos_feature_overrides', JSON.stringify(overrides));
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: defaultFlags,
  overrides: loadOverrides(),

  isEnabled: (key) => {
    const { flags, overrides } = get();
    const flag = flags.find((f) => f.key === key);
    if (!flag) return false;
    const override = overrides.find((o) => o.flagKey === key);
    return override !== undefined ? override.enabled : flag.defaultEnabled;
  },

  setOverride: (key, enabled) => {
    const overrides = [...get().overrides.filter((o) => o.flagKey !== key), { flagKey: key, enabled }];
    saveOverrides(overrides);
    set({ overrides });
  },

  resetOverrides: () => {
    saveOverrides([]);
    set({ overrides: [] });
  },
}));
