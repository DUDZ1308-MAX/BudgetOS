import { useState } from 'react';

interface Props {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

export function ReportExporter({ onExportCSV, onExportExcel, onExportPDF, disabled }: Props) {
  const [open, setOpen] = useState(false);

  if (disabled) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
      >
        Export ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 mt-1 w-36 rounded-xl border py-1 shadow-lg"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-primary)' }}
          >
            <button onClick={() => { setOpen(false); onExportCSV(); }} className="w-full px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              Export CSV
            </button>
            <button onClick={() => { setOpen(false); onExportExcel(); }} className="w-full px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              Export Excel
            </button>
            <button onClick={() => { setOpen(false); onExportPDF(); }} className="w-full px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
