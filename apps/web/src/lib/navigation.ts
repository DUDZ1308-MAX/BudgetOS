import type { ComponentType, SVGProps } from 'react';
import {
  IconDashboard,
  IconAccounts,
  IconTransactions,
  IconBudgets,
  IconSavings,
  IconMortgage,
  IconReports,
  IconSettings,
  IconSparkles,
  IconCrown,
  IconHeart,
  IconBell,
  IconRecurring,
  IconCalendar,
} from '@/components/ui/Icons';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
}

export const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: IconDashboard },
  { label: 'Accounts', href: '/accounts', icon: IconAccounts },
  { label: 'Transactions', href: '/transactions', icon: IconTransactions },
  { label: 'Calendar', href: '/calendar', icon: IconCalendar },
  { label: 'Recurring', href: '/recurring', icon: IconRecurring },
  { label: 'Budgets', href: '/budgets', icon: IconBudgets },
  { label: 'Savings Goals', href: '/savings', icon: IconSavings },
  { label: 'Mortgage', href: '/mortgage', icon: IconMortgage },
  { label: 'Reports', href: '/reports', icon: IconReports },
  { label: 'Financial Health', href: '/health', icon: IconHeart },
  { label: 'Notifications', href: '/notifications', icon: IconBell },
  { label: 'AI Copilot', href: '/ai', icon: IconSparkles },
  { label: 'Billing', href: '/billing', icon: IconCrown },
  { label: 'Settings', href: '/settings', icon: IconSettings },
];
