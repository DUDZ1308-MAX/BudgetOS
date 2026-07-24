import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface BillItem {
  id: string;
  name: string;
  amount: number;
  type: string;
}

interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  daysUntil: number;
}

interface PaycheckInfo {
  name: string;
  amount: number;
  date: string;
  daysUntil: number;
}

interface SavingsTransfer {
  id: string;
  name: string;
  amount: number;
  date: string;
}

interface CashFlowDay {
  date: string;
  balance: number;
  netChange: number;
}

interface RecurringWidgetsProps {
  billsDueToday: BillItem[];
  upcomingBills: UpcomingItem[];
  upcomingIncome: UpcomingItem[];
  nextPaycheck: PaycheckInfo | null;
  upcomingSavingsTransfers: SavingsTransfer[];
  cashFlowForecast: CashFlowDay[];
}

export const RecurringWidgets = memo(function RecurringWidgets({
  billsDueToday,
  upcomingBills,
  upcomingIncome,
  nextPaycheck,
  upcomingSavingsTransfers,
  cashFlowForecast,
}: RecurringWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Bills Due Today */}
      <DashboardCard title="Bills Due Today" subtitle={billsDueToday.length === 0 ? 'None due' : `${billsDueToday.length} bill${billsDueToday.length > 1 ? 's' : ''}`}>
        {billsDueToday.length === 0 ? (
          <p className="text-sm text-gray-500">No bills due today</p>
        ) : (
          <div className="space-y-2">
            {billsDueToday.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-200 truncate">{b.name}</span>
                <span className="text-sm font-semibold text-red-400">-{formatCurrency(b.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Next Paycheck */}
      <DashboardCard title="Next Paycheck" subtitle={nextPaycheck ? `${nextPaycheck.daysUntil === 0 ? 'Today' : nextPaycheck.daysUntil === 1 ? 'Tomorrow' : `In ${nextPaycheck.daysUntil} days`}` : 'No upcoming'}>
        {nextPaycheck ? (
          <div>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(nextPaycheck.amount)}</p>
            <p className="text-sm text-gray-400 mt-1">{nextPaycheck.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(nextPaycheck.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No upcoming paychecks</p>
        )}
      </DashboardCard>

      {/* Upcoming Bills */}
      <DashboardCard title="Upcoming Bills" subtitle={upcomingBills.length === 0 ? 'None' : `Next ${upcomingBills.length}`}>
        {upcomingBills.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming bills in 30 days</p>
        ) : (
          <div className="space-y-1.5">
            {upcomingBills.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-200 truncate">{b.name}</p>
                  <span className="text-[10px] text-gray-500">
                    {b.daysUntil === 0 ? 'Today' : b.daysUntil === 1 ? 'Tomorrow' : `${b.daysUntil}d`}
                  </span>
                </div>
                <span className="text-xs font-semibold text-red-400 ml-2">-{formatCurrency(b.amount)}</span>
              </div>
            ))}
            {upcomingBills.length > 5 && (
              <p className="text-[10px] text-gray-500">+{upcomingBills.length - 5} more</p>
            )}
          </div>
        )}
      </DashboardCard>

      {/* Upcoming Income */}
      <DashboardCard title="Upcoming Income" subtitle={upcomingIncome.length === 0 ? 'None' : `Next ${upcomingIncome.length}`}>
        {upcomingIncome.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming income in 30 days</p>
        ) : (
          <div className="space-y-1.5">
            {upcomingIncome.slice(0, 5).map((i) => (
              <div key={i.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-200 truncate">{i.name}</p>
                  <span className="text-[10px] text-gray-500">
                    {i.daysUntil === 0 ? 'Today' : i.daysUntil === 1 ? 'Tomorrow' : `${i.daysUntil}d`}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 ml-2">+{formatCurrency(i.amount)}</span>
              </div>
            ))}
            {upcomingIncome.length > 5 && (
              <p className="text-[10px] text-gray-500">+{upcomingIncome.length - 5} more</p>
            )}
          </div>
        )}
      </DashboardCard>

      {/* Upcoming Savings Transfers */}
      <DashboardCard title="Savings Transfers" subtitle={upcomingSavingsTransfers.length === 0 ? 'None' : `${upcomingSavingsTransfers.length} upcoming`}>
        {upcomingSavingsTransfers.length === 0 ? (
          <p className="text-sm text-gray-500">No savings transfers scheduled</p>
        ) : (
          <div className="space-y-1.5">
            {upcomingSavingsTransfers.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-200 truncate">{s.name}</span>
                <span className="text-xs font-semibold text-blue-400">-{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* 30-Day Cash Flow Forecast */}
      <DashboardCard title="30-Day Forecast" subtitle={
        cashFlowForecast.length > 0
          ? `${formatCurrency(cashFlowForecast[cashFlowForecast.length - 1]?.balance ?? 0)} projected`
          : 'No data'
      }>
        {cashFlowForecast.length > 0 && (
          <div>
            <div className="flex items-end gap-0.5 h-16 mb-2">
              {cashFlowForecast.filter((_, i) => i % 3 === 0).map((day) => {
                const min = Math.min(...cashFlowForecast.map((d) => d.balance));
                const max = Math.max(...cashFlowForecast.map((d) => d.balance));
                const range = max - min || 1;
                const height = ((day.balance - min) / range) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      background: day.balance >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                      opacity: 0.7,
                    }}
                    title={`${day.date}: ${formatCurrency(day.balance)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Start</span>
              <span>30 days</span>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
});
