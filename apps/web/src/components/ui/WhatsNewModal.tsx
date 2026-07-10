import { useEffect } from 'react';
import { useReleaseNotesStore } from '@/stores/releaseNotes';
import { IconMegaphone } from '@/components/ui/Icons';

export function WhatsNewModal() {
  const { latestRelease, hasUnseen, markSeen } = useReleaseNotesStore();

  useEffect(() => {
    if (hasUnseen() && latestRelease()) {
      const modal = document.getElementById('whats-new-modal');
      if (modal) {
        const dialog = modal.querySelector('dialog');
        if (dialog && !dialog.open) {
          dialog.showModal();
        }
      }
    }
  }, []);

  const release = latestRelease();
  if (!release) return null;

  const handleClose = () => {
    markSeen(release.version);
    const dialog = document.getElementById('whats-new-dialog') as HTMLDialogElement | null;
    dialog?.close();
  };

  return (
    <div id="whats-new-modal">
      <dialog
        id="whats-new-dialog"
        className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <IconMegaphone className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">What's New</h2>
              <p className="text-xs text-slate-500">Version {release.version} — {release.date}</p>
            </div>
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{release.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{release.description}</p>

          {release.highlights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">What's New</h4>
              <ul className="space-y-1.5">
                {release.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {release.fixes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Fixes & Improvements</h4>
              <ul className="space-y-1.5">
                {release.fixes.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </dialog>
    </div>
  );
}
