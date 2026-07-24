import { useState, useCallback, useMemo } from 'react';
import type { ReportTab, ReportFilterState, ReportFilters, TimeRange } from './reportTypes';
import { computeTimeRange } from './utils/reportCalculator';

export function useReportFilters() {
  const [state, setState] = useState<ReportFilterState>({
    tab: 'monthly',
    timeRange: '1y',
    accountId: null,
    categoryId: null,
    budgetId: null,
    type: 'all',
  });

  const setTab = useCallback((tab: ReportTab) => setState((s) => ({ ...s, tab })), []);
  const setTimeRange = useCallback((timeRange: TimeRange) => setState((s) => ({ ...s, timeRange })), []);
  const setAccountId = useCallback((accountId: string | null) => setState((s) => ({ ...s, accountId })), []);
  const setCategoryId = useCallback((categoryId: string | null) => setState((s) => ({ ...s, categoryId })), []);
  const setBudgetId = useCallback((budgetId: string | null) => setState((s) => ({ ...s, budgetId })), []);
  const setType = useCallback((type: 'all' | 'income' | 'expense') => setState((s) => ({ ...s, type })), []);

  const filters: ReportFilters = useMemo(() => ({
    dateRange: computeTimeRange(state.timeRange),
    timeRange: state.timeRange,
    accountId: state.accountId,
    categoryId: state.categoryId,
    budgetId: state.budgetId,
    type: state.type,
  }), [state]);

  const tabs: { key: ReportTab; label: string }[] = useMemo(() => [
    { key: 'monthly', label: 'Summary' },
    { key: 'income', label: 'Income' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'category', label: 'Categories' },
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'budget', label: 'Budget' },
    { key: 'savings', label: 'Savings' },
    { key: 'mortgage', label: 'Mortgage' },
    { key: 'networth', label: 'Net Worth' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'forecast', label: 'Forecast' },
  ], []);

  return { state, filters, tabs, setTab, setTimeRange, setAccountId, setCategoryId, setBudgetId, setType };
}
