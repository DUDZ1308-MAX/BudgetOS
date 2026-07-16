import { useState, useRef, useCallback } from 'react';
import { useFeedbackStore } from '@/stores/feedback';
import type { FeedbackType } from '@/stores/feedback';
import { IconFeedback, IconSparkles } from '@/components/ui/Icons';

const TYPE_OPTIONS: { value: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'bug', label: 'Report Bug', icon: IconBugIcon },
  { value: 'feature', label: 'Suggest Feature', icon: IconSparkles },
  { value: 'general', label: 'General Feedback', icon: IconMessageSquareIcon },
];

function IconBugIcon(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M4 10h16" />
      <path d="M4 14h16" />
      <path d="M12 6v12" />
      <path d="M8 18l-2 3" />
      <path d="M16 18l2 3" />
    </svg>
  );
}

function IconMessageSquareIcon(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function FeedbackWidget() {
  const { isOpen, setOpen, submit } = useFeedbackStore();
  const [type, setType] = useState<FeedbackType>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    submit({
      type,
      title,
      description,
      screenshot,
      metadata: {
        appVersion: '1.0.0',
        browser: navigator.userAgent,
        os: navigator.platform,
        route: window.location.pathname,
      },
    });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setTitle('');
      setDescription('');
      setType('general');
      setScreenshot(undefined);
    }, 2000);
  }, [type, title, description, screenshot, submit, setOpen]);

  const handleScreenshot = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(!isOpen)}
        className="fixed right-4 bottom-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-all hover:scale-105"
        aria-label="Open feedback"
      >
        <IconFeedback className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed bottom-24 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {submitted ? 'Thanks!' : 'Send Feedback'}
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Feedback submitted!</p>
                <p className="text-xs text-slate-500">Thanks for helping improve MyBudgetOS.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 p-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                          type === opt.value
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <opt.icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="fb-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    id="fb-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary..."
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="fb-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    id="fb-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us more..."
                    required
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 w-full"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    {screenshot ? 'Screenshot attached' : 'Attach screenshot (optional)'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                  {screenshot && (
                    <button type="button" onClick={() => setScreenshot(undefined)} className="mt-1 text-xs text-red-500 hover:text-red-600">Remove</button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
