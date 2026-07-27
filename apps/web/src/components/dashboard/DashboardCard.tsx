import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ClickableCard } from '@/components/dashboard/ClickableCard';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  accent?: 'none' | 'top' | 'left' | 'success' | 'error' | 'warning';
  href?: string;
  onClick?: () => void;
}

const accentClasses: Record<string, string> = {
  none: '',
  top: 'accent-strip-top',
  left: 'accent-strip-left',
  success: 'accent-strip-success',
  error: 'accent-strip-error',
  warning: 'accent-strip-warning',
};

export function DashboardCard({ title, subtitle, action, children, className = '', delay = 0, accent = 'none', href, onClick }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`premium-card-3d glass-overlay premium-card-glow overflow-hidden ${accentClasses[accent]} ${className}`}
    >
      <ClickableCard href={href} onClick={onClick} className="flex flex-col flex-1">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4" style={{ borderColor: 'var(--border-default)' }}>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold sm:text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p className="mt-0.5 text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          {action && <div className="ml-3 shrink-0 sm:ml-4">{action}</div>}
        </div>
        <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">{children}</div>
      </ClickableCard>
    </motion.div>
  );
}
