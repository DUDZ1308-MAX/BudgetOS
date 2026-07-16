import { memo, useEffect, useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  interestSaved: number;
  totalInterest: number;
  monthlyPayment: number;
  payoffMonthsOriginal: number;
  payoffMonthsCurrent: number;
  monthsSaved: number;
  isLoading?: boolean;
}

function AnimatedCounter({ target, prefix = '$', duration = 1200 }: { target: number; prefix?: string; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span>{prefix}{formatCurrency(value).slice(1)}</span>;
}

export const InterestSaved = memo(function InterestSaved({
  interestSaved,
  totalInterest,
  monthlyPayment,
  payoffMonthsOriginal,
  payoffMonthsCurrent,
  monthsSaved,
  isLoading,
}: Props) {
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remainingMonths = monthsSaved % 12;

  if (isLoading) {
    return (
      <DashboardCard title="Interest Saved from Extra Payments">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (interestSaved <= 0 && monthsSaved <= 0) {
    return (
      <DashboardCard title="Interest Saved from Extra Payments">
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">Add extra payments to see interest savings.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Interest Saved from Extra Payments"
      subtitle="Impact of your extra payments"
    >
      <div className="space-y-4">
        {/* Hero stat */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Interest Saved</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            <AnimatedCounter target={interestSaved} />
          </p>
          <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
            {monthsSaved > 0 && (
              <>
                Payoff accelerated by{' '}
                <span className="font-semibold">
                  {yearsSaved > 0 && `${yearsSaved} year${yearsSaved !== 1 ? 's' : ''}`}
                  {yearsSaved > 0 && remainingMonths > 0 && ' '}
                  {remainingMonths > 0 && `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Comparison bars */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Original payoff</span>
              <span className="text-xs font-medium text-slate-700 dark:text-white tabular-nums">
                {Math.ceil(payoffMonthsOriginal / 12)} years ({payoffMonthsOriginal} months)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-slate-300 dark:bg-slate-600"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">With extra payments</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                {Math.ceil(payoffMonthsCurrent / 12)} years ({payoffMonthsCurrent} months)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${payoffMonthsOriginal > 0 ? (payoffMonthsCurrent / payoffMonthsOriginal) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Original Interest</p>
            <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-white tabular-nums">
              {formatCurrency(totalInterest + interestSaved)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">New Interest</p>
            <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-white tabular-nums">
              {formatCurrency(totalInterest)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Payment</p>
            <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-white tabular-nums">
              {formatCurrency(monthlyPayment)}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});
