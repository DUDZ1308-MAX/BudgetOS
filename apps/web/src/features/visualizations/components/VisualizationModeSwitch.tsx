import { useCallback, useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import type { ViewMode } from '../visualizationTypes';

const STORAGE_KEY = 'budgetos-view-mode';

interface ViewModeContextValue {
  mode: ViewMode;
  toggle: () => void;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue>({
  mode: '2d',
  toggle: () => {},
  setMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeContext);
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '3d' || stored === '2d') return stored;
    } catch {}
    return '2d';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const toggle = useCallback(() => {
    setModeState((prev) => (prev === '2d' ? '3d' : '2d'));
  }, []);

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
  }, []);

  return (
    <ViewModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

interface VisualizationModeSwitchProps {
  className?: string;
}

export function VisualizationModeSwitch({ className = '' }: VisualizationModeSwitchProps) {
  const { mode, toggle } = useViewMode();

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
      style={{
        borderColor: 'var(--border-default)',
        background: mode === '3d' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        color: mode === '3d' ? 'white' : 'var(--text-secondary)',
      }}
      aria-label={`Switch to ${mode === '2d' ? '3D' : '2D'} view`}
      aria-pressed={mode === '3d'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      {mode === '3d' ? '3D Active' : '3D View'}
    </button>
  );
}
