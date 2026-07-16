import { useState } from 'react';
import { useCreateFeedback } from '@/hooks/useFeedback';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { FeedbackType } from '@budgetos/database';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string; description: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: '🐛', description: 'Report something that isn\'t working' },
  { value: 'feature', label: 'Feature Request', icon: '💡', description: 'Suggest a new feature or improvement' },
  { value: 'general', label: 'General Feedback', icon: '💬', description: 'Share your thoughts or ideas' },
];

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const createFeedback = useCreateFeedback();

  const [type, setType] = useState<FeedbackType>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }

    if (message.trim().length < 10) {
      addToast('error', 'Message must be at least 10 characters');
      return;
    }

    try {
      await createFeedback.mutateAsync({
        type,
        title: title.trim(),
        message: message.trim(),
        email: email.trim() || null,
      });

      setSubmitted(true);
      addToast('success', 'Thank you! Your feedback has been submitted.');
      onSuccess?.();
    } catch {
      addToast('error', 'Failed to submit feedback. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Feedback Submitted!</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Thank you for helping us improve MyBudgetOS. We review all feedback and may reach out if we need more details.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setTitle('');
            setMessage('');
            setEmail('');
          }}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Feedback Type *
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FEEDBACK_TYPES.map((ft) => (
            <button
              key={ft.value}
              type="button"
              onClick={() => setType(ft.value)}
              className={`flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all ${
                type === ft.value
                  ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-2xl">{ft.icon}</span>
              <span className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{ft.label}</span>
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ft.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="feedback-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title *
        </label>
        <input
          id="feedback-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your feedback"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          required
        />
      </div>

      <div>
        <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Details *
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please provide as much detail as possible..."
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          required
          minLength={10}
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{message.length} / 5000 characters</p>
      </div>

      <div>
        <label htmlFor="feedback-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email (optional)
        </label>
        <input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={user?.email ?? 'your@email.com'}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Only if you'd like us to follow up with you directly
        </p>
      </div>

      <button
        type="submit"
        disabled={createFeedback.isPending || !title.trim() || !message.trim()}
        className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
