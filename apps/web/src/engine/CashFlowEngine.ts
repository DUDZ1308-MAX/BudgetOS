import type { CashFlowSummary, DailyBalance, CashFlowEngineInput } from './types';
import { parseDate, formatDateISO } from './utils';

export function computeCashFlowSummary(input: CashFlowEngineInput): CashFlowSummary {
  if (!input) return createEmptyCashFlowSummary();
  const { transactions = [], accounts = [] } = input;
  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.balance, 0);

  const active = transactions.filter((t) => !t.is_archived);

  const dailyMap = new Map<string, { income: number; expenses: number }>();

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const txn of active) {
    const amount = txn.amount;
    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }

    const existing = dailyMap.get(txn.date);
    if (existing) {
      if (amount >= 0) existing.income += amount;
      else existing.expenses += amount;
    } else {
      dailyMap.set(txn.date, {
        income: amount >= 0 ? amount : 0,
        expenses: amount < 0 ? amount : 0,
      });
    }
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyBalances: DailyBalance[] = [];
  let runningBalance = totalBalance;

  if (sortedDates.length === 0) {
    return {
      dailyBalances: [],
      sevenDayTrend: 0,
      thirtyDayTrend: 0,
      incomeVsExpenseRatio: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
    };
  }

  const dateRangeStart = parseDate(sortedDates[0]!);
  const dateRangeEnd = parseDate(sortedDates[sortedDates.length - 1]!);

  const cursor = new Date(dateRangeStart);
  while (cursor <= dateRangeEnd) {
    const dateStr = formatDateISO(cursor);
    const dayData = dailyMap.get(dateStr);
    const dayIncome = dayData?.income ?? 0;
    const dayExpenses = dayData?.expenses ?? 0;
    const dayNet = dayIncome + dayExpenses;
    runningBalance += dayNet;

    dailyBalances.push({
      date: dateStr,
      income: dayIncome,
      expenses: Math.abs(dayExpenses),
      net: dayNet,
      runningBalance,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const totalExpensesAbs = Math.abs(totalExpenses);
  const incomeVsExpenseRatio = totalExpensesAbs > 0 ? totalIncome / totalExpensesAbs : totalIncome > 0 ? Infinity : 0;

  const sevenDayTrend = computePeriodTrend(dailyBalances, 7);
  const thirtyDayTrend = computePeriodTrend(dailyBalances, 30);

  return {
    dailyBalances,
    sevenDayTrend,
    thirtyDayTrend,
    incomeVsExpenseRatio,
    totalIncome,
    totalExpenses: totalExpensesAbs,
    netFlow: totalIncome - totalExpensesAbs,
  };
}

function createEmptyCashFlowSummary(): CashFlowSummary {
  return {
    dailyBalances: [], sevenDayTrend: 0, thirtyDayTrend: 0,
    incomeVsExpenseRatio: 0, totalIncome: 0, totalExpenses: 0, netFlow: 0,
  };
}

function computePeriodTrend(balances: DailyBalance[], days: number): number {
  if (balances.length < 2) return 0;

  const period = Math.min(days, balances.length);
  const recent = balances.slice(-period);
  const first = recent[0];
  const last = recent[recent.length - 1];

  if (!first || !last) return 0;
  return last.runningBalance - first.runningBalance;
}
