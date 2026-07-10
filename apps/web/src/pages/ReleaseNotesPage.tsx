import { releaseHistory } from '@/data/releaseHistory';
import { IconMegaphone } from '@/components/ui/Icons';

const TYPE_STYLES = {
  major: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  minor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  patch: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  beta: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function ReleaseNotesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <IconMegaphone className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Release Notes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track what's new in BudgetOS.</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-px bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-8">
          {releaseHistory.map((release, index) => (
            <div key={release.version} className="relative pl-10">
              <div className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                index === 0
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
              }`} />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">v{release.version}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_STYLES[release.type]}`}>
                        {release.type}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">{release.title}</h3>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{release.date}</span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{release.description}</p>

                {release.highlights.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">What's New</h4>
                    <ul className="space-y-1.5">
                      {release.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {release.fixes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Fixes & Improvements</h4>
                    <ul className="space-y-1.5">
                      {release.fixes.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Stay tuned for more updates. Follow us for the latest news.</p>
      </div>
    </div>
  );
}
