import { NavLink } from 'react-router-dom';
import { useThemeStore } from '@/stores/theme';
import { navigation, type NavItem } from '@/lib/navigation';
import { IconSun, IconMoon } from '@/components/ui/Icons';
import { releaseHistory } from '@/data/releaseHistory';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const APP_VERSION = releaseHistory[0]?.version ?? '1.0.0';

const navGroups = [
  {
    label: 'Overview',
    items: ['Dashboard', 'Reports'] as const,
  },
  {
    label: 'Manage',
    items: ['Accounts', 'Transactions', 'Recurring', 'Budgets', 'Savings Goals'] as const,
  },
  {
    label: 'Planning',
    items: ['Mortgage', 'Financial Health'] as const,
  },
  {
    label: 'Tools',
    items: ['AI Copilot', 'Notifications', 'Billing', 'Settings'] as const,
  },
];

function groupNavItems(items: NavItem[]) {
  const lookup = new Map(items.map((i) => [i.label, i]));
  return navGroups.map((g) => ({
    ...g,
    items: g.items.map((n) => lookup.get(n)).filter(Boolean) as NavItem[],
  }));
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { theme, toggle } = useThemeStore();
  const grouped = groupNavItems(navigation);

  const navContent = (
    <nav role="navigation" aria-label="Main navigation" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  end={item.href === '/dashboard'}
                  role="link"
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/60 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 dark:bg-brand-400" />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-brand-600 dark:text-brand-300'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footerContent = (
    <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
      >
        {theme !== 'light' ? (
          <IconSun className="h-5 w-5 text-slate-400" />
        ) : (
          <IconMoon className="h-5 w-5 text-slate-400" />
        )}
        <span>{theme !== 'light' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
      <p className="px-3 pt-1 text-[10px] text-slate-300 dark:text-slate-600">v{APP_VERSION}</p>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <span className="text-sm font-bold text-white">B</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MyBudgetOS</span>
        </div>
        {navContent}
        {footerContent}
      </aside>
      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MyBudgetOS</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {navContent}
        {footerContent}
      </aside>
    </>
  );
}
