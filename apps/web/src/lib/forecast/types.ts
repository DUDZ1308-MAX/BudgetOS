import type { CalendarEvent } from '@/lib/dashboard/types';

export type ForecastWindow = 30 | 60 | 90;

export interface ForecastRecurringInput {
  id: string;
  name: string;
  amount: number;
  type: string;
  frequency: string;
  intervalCount: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  startDate: string;
  endDate: string | null;
  nextRun: string | null;
  lastRun: string | null;
  status: string;
}

export interface ForecastSavingsInput {
  id: string;
  name: string;
  monthlyContribution: number;
  isCompleted: boolean;
}

export interface ForecastMortgageInput {
  id: string;
  name: string;
  monthlyPayment: number;
  paymentFrequency: string;
  remainingBalance: number;
  startDate: string | null;
}

export interface ForecastTransactionInput {
  id: string;
  amount: number;
  date: string;
  merchant: string | null;
  categoryId: string | null;
  accountId: string | null;
  recurringId: string | null;
  isArchived: boolean;
}

export interface ForecastRangeSummary {
  window: ForecastWindow;
  startDate: string;
  endDate: string;
  startingBalance: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  endingBalance: number;
  lowestBalance: number;
  lowestBalanceDate: string | null;
  daysBelowZero: number;
  events: CalendarEvent[];
}

export interface ForecastWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  date: string | null;
}

export interface CashFlowForecast {
  asOfDate: string;
  availableCash: number;
  daily: Array<{ date: string; balance: number; netChange: number }>;
  ranges: Partial<Record<ForecastWindow, ForecastRangeSummary>>;
  warnings: ForecastWarning[];
  eventCount: number;
  recurringCount: number;
  mortgageCount: number;
  savingsCount: number;
}
