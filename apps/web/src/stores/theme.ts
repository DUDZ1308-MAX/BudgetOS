import { create } from 'zustand';

export type Theme =
  | 'mybudgetos-dark'
  | 'midnight-blue'
  | 'forest'
  | 'slate'
  | 'light';

export interface ThemeDefinition {
  id: Theme;
  name: string;
  description: string;
  accent: string;
  preview: {
    bg: string;
    surface: string;
    text: string;
    accent: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'mybudgetos-dark',
    name: 'MyBudgetOS Dark',
    description: 'Classic deep dark with indigo accents',
    accent: '#6366f1',
    preview: {
      bg: '#020617',
      surface: '#1e293b',
      text: '#f8fafc',
      accent: '#6366f1',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Cool blue tones for a calm workspace',
    accent: '#3b82f6',
    preview: {
      bg: '#0a0e1a',
      surface: '#151d33',
      text: '#e2e8f0',
      accent: '#3b82f6',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green hues for a fresh feel',
    accent: '#22c55e',
    preview: {
      bg: '#0a120e',
      surface: '#162019',
      text: '#e2efe8',
      accent: '#22c55e',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Neutral gray palette, minimal and clean',
    accent: '#a1a1aa',
    preview: {
      bg: '#111113',
      surface: '#27272a',
      text: '#fafafa',
      accent: '#a1a1aa',
    },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Bright and airy for daytime use',
    accent: '#4f46e5',
    preview: {
      bg: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      accent: '#4f46e5',
    },
  },
];

const STORAGE_KEY = 'budgetos-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored as Theme;
    }
  } catch {
    // SSR or storage error
  }
  return 'mybudgetos-dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
  },
  toggle: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'mybudgetos-dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return { theme: next };
    }),
}));

// Apply theme on load
applyTheme(getInitialTheme());
