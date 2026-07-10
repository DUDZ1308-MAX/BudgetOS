import { NavLink } from 'react-router-dom';
import { IconDashboard, IconAccounts, IconTransactions, IconBudgets, IconSettings } from '@/components/ui/Icons';

const mobileNavItems = [
  { label: 'Home', href: '/dashboard', icon: IconDashboard },
  { label: 'Accounts', href: '/accounts', icon: IconAccounts },
  { label: 'Transactions', href: '/transactions', icon: IconTransactions },
  { label: 'Budgets', href: '/budgets', icon: IconBudgets },
  { label: 'More', href: '/settings', icon: IconSettings },
] as const;

export function MobileNav() {
  return (
    <nav role="navigation" aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
