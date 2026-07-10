import { useAnnouncementsStore } from '@/stores/announcements';
import { IconMegaphone } from '@/components/ui/Icons';

export function AnnouncementBanner() {
  const { announcements, readIds, markRead } = useAnnouncementsStore();
  const unread = announcements.filter((a) => !readIds.includes(a.id));

  if (unread.length === 0) return null;

  const latest = unread[0]!;

  return (
    <div className="flex items-center justify-between gap-3 bg-indigo-500/10 px-4 py-2 text-sm border-b border-indigo-500/20">
      <div className="flex items-center gap-2 min-w-0">
        <IconMegaphone className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <span className="truncate text-indigo-700 dark:text-indigo-300">
          {latest.title}
        </span>
        <span className="hidden sm:inline truncate text-indigo-500 dark:text-indigo-400">
          — {latest.body}
        </span>
        {latest.link && (
          <a
            href={latest.link.href}
            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
          >
            {latest.link.label}
          </a>
        )}
      </div>
      <button
        onClick={() => markRead(latest.id)}
        className="shrink-0 rounded-lg p-1 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
        aria-label="Dismiss announcement"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

function IconX(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
