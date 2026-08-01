import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { useDemoStore } from '@/stores/demoMode';
import { useAnnouncementsStore } from '@/stores/announcements';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { IconBell, IconMenu, IconDemo } from '@/components/ui/Icons';
import { NotificationPanel } from './NotificationPanel';

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

function getDisplayName(profile: { display_name?: string | null; full_name?: string | null } | null, email?: string): string {
  if (profile?.display_name) return profile.display_name;
  if (profile?.full_name) return profile.full_name;
  if (email) return email.split('@')[0] ?? email;
  return 'there';
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const isDemo = useDemoStore((s) => s.isDemo);
  const unreadAnnouncements = useAnnouncementsStore((s) => s.announcements.filter((a) => !s.readIds.includes(a.id)).length);
  const displayName = getDisplayName(profile, user?.email);
  const initial = displayName.charAt(0).toUpperCase();

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const [showNotifications, setShowNotifications] = useState(false);

  const totalUnread = unreadCount + unreadAnnouncements;

  return (
    <header role="banner" className="relative z-[60] flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open sidebar"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <img src="/logo.png" alt="MyBudgetOS" className="hidden h-8 w-8 rounded-lg object-contain md:block" />
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
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <IconBell className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
          <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>

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
          className="ml-1 hidden min-h-[44px] items-center rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:inline-flex"
          aria-label="Sign out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
