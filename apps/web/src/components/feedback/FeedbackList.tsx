import { useFeedback, useDeleteFeedback } from '@/hooks/useFeedback';
import { useToastStore } from '@/stores/toast';
import type { Feedback, FeedbackType, FeedbackStatus } from '@budgetos/database';

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: string; color: string }> = {
  bug: { label: 'Bug', icon: '🐛', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  feature: { label: 'Feature', icon: '💡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  general: { label: 'General', icon: '💬', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FeedbackList() {
  const { data: feedback = [], isLoading } = useFeedback();
  const deleteFeedback = useDeleteFeedback();
  const addToast = useToastStore((s) => s.addToast);

  const handleDelete = async (id: string) => {
    try {
      await deleteFeedback.mutateAsync(id);
      addToast('success', 'Feedback deleted');
    } catch {
      addToast('error', 'Failed to delete feedback');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1">
                <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <span className="text-xl">📝</span>
        </div>
        <h3 className="mt-3 text-sm font-medium text-slate-900 dark:text-white">No feedback yet</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Submit your first feedback using the form above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((item: Feedback) => {
        const typeConfig = TYPE_CONFIG[item.type];
        const statusConfig = STATUS_CONFIG[item.status];

        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeConfig.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</h4>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                aria-label="Delete feedback"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
