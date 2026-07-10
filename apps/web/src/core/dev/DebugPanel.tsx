import { useState, useEffect } from 'react';
import { useAuditStore } from '@/core/audit';
import { getLastPersistenceWriteTime } from '@/core/persistence';

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const [engineState, setEngineState] = useState<Record<string, unknown>>({});
  const entryCount = useAuditStore((s) => s.entries.length);
  const lastWrite = getLastPersistenceWriteTime();

  useEffect(() => {
    if (!expanded) return;
    try {
      const engine = (window as any).__budgetos_engine;
      if (engine) setEngineState(engine);
    } catch { /* ignore */ }
  }, [expanded]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-mono text-white shadow-lg hover:bg-slate-700"
      >
        {expanded ? '✕ Debug' : '🐛 Debug'}
      </button>
      {expanded && (
        <div className="absolute bottom-10 right-0 w-96 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Debug Panel</h3>
          <div className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
            <div className="rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="font-semibold">Audit Entries:</span> {entryCount}
            </div>
            <div className="rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="font-semibold">Last Persistence Write:</span>{' '}
              {lastWrite > 0 ? new Date(lastWrite).toLocaleTimeString() : 'never'}
            </div>
            <div className="rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="font-semibold">Engine State:</span>
              <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(engineState, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
