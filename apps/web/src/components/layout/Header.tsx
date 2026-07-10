import { useAuthStore } from '@/stores/auth';
import { useDemoStore } from '@/stores/demoMode';
import { useAnnouncementsStore } from '@/stores/announcements';
import { IconBell, IconMenu, IconDemo, IconMegaphone } from '@/components/ui/Icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(date: Date): string {
  const dayName = DAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];
  return `${dayName}, ${monthName} ${date.getDate()}, ${date.getFullYear()}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const isDemo = useDemoStore((s) => s.isDemo);
  const unreadAnnouncements = useAnnouncementsStore((s) => s.announcements.filter((a) => !s.readIds.includes(a.id)).length);
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header role="banner" className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open sidebar"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            {greeting()}, <span className="text-indigo-600 dark:text-indigo-400">{displayName}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500" aria-label={`Current date: ${formatDate(new Date())}`}>{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {isDemo && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <IconDemo className="h-3.5 w-3.5" />
            Demo
          </span>
        )}
        <button className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Notifications">
          <IconBell className="h-5 w-5" />
          {unreadAnnouncements > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadAnnouncements}
            </span>
          )}
        </button>

        <div className="mx-2 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 md:block" />

        <div className="hidden items-center gap-2 md:flex" aria-label="User menu">
          <span className="max-w-[140px] truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-sm">
            {initial}
          </div>
        </div>

        <button
          onClick={() => {
            signOut();
          }}
          className="ml-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Sign out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
