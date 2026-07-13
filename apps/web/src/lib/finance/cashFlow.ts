import { sumIncome, sumExpenses, filterActive, type TransactionInput } from './transactions';
import { daysBetween } from './dates';

export interface DailyBalance {
  date: string;
  income: number;
  expenses: number;
  net: number;
  runningBalance: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  incomeVsExpenseRatio: number;
  dailyBalances: DailyBalance[];
}

export function calculateMonthlyIncome(
  transactions: TransactionInput[],
  months: number = 1,
): number {
  const total = sumIncome(transactions);
  return months > 0 ? total / months : 0;
}

export function calculateMonthlyExpenses(
  transactions: TransactionInput[],
  months: number = 1,
): number {
  const total = sumExpenses(transactions);
  return months > 0 ? total / months : 0;
}

export function calculateCashFlow(
  transactions: TransactionInput[],
  months: number = 1,
): number {
  const income = calculateMonthlyIncome(transactions, months);
  const expenses = calculateMonthlyExpenses(transactions, months);
  return income - expenses;
}

export function calculateNetFlow(
  totalIncome: number,
  totalExpenses: number,
): number {
  return totalIncome - totalExpenses;
}

export function calculateIncomeVsExpenseRatio(
  totalIncome: number,
  totalExpenses: number,
): number {
  if (totalExpenses === 0) return totalIncome > 0 ? Infinity : 0;
  return totalIncome / totalExpenses;
}

export function calculateBurnRate(
  transactions: TransactionInput[],
  days: number,
): number {
  const total = sumExpenses(transactions);
  if (days <= 0) return 0;
  return total / days;
}

export function calculateAverageMonthlySpend(
  transactions: TransactionInput[],
): number {
  const active = filterActive(transactions);
  if (active.length === 0) return 0;

  const dates = active.map((t) => t.date).sort();
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const spanDays = daysBetween(first, last);
  const spanMonths = Math.max(1, spanDays / 30.44);

  return sumExpenses(active) / spanMonths;
}

export function calculateSafeToSpend(
  remainingBudget: number,
  monthlyIncome: number,
  daysRemaining: number,
  upcomingFixedExpenses: number = 0,
): { safeToSpendToday: number; riskLevel: 'low' | 'medium' | 'high'; explanation: string } {
  const safetyBuffer = monthlyIncome * 0.1;
  const afterReserves = remainingBudget - upcomingFixedExpenses - safetyBuffer;

  if (daysRemaining <= 0) {
    return {
      safeToSpendToday: 0,
      riskLevel: 'high',
      explanation: 'No days remaining in the period.',
    };
  }

  const safeToSpendToday = Math.max(0, Math.round((afterReserves / daysRemaining) * 100) / 100);

  let riskLevel: 'low' | 'medium' | 'high';
  if (remainingBudget <= 0 || safeToSpendToday <= 0) {
    riskLevel = 'high';
  } else {
    const baseline = remainingBudget / daysRemaining;
    riskLevel = safeToSpendToday < baseline * 0.5 ? 'medium' : 'low';
  }

  const explanation = riskLevel === 'low'
    ? 'You have sufficient budget remaining for discretionary spending.'
    : riskLevel === 'medium'
      ? 'Consider reducing discretionary spending to stay on track.'
      : 'Your budget is tight. Limit discretionary spending.';

  return { safeToSpendToday, riskLevel, explanation };
}

export function computeCashFlowSummary(
  transactions: TransactionInput[],
  startDate: string,
  endDate: string,
): CashFlowSummary {
  const active = filterActive(transactions).filter((t) => t.date >= startDate && t.date <= endDate);
  const totalIncome = sumIncome(active);
  const totalExpenses = sumExpenses(active);
  const netFlow = calculateNetFlow(totalIncome, totalExpenses);
  const incomeVsExpenseRatio = calculateIncomeVsExpenseRatio(totalIncome, totalExpenses);

  const dateMap = new Map<string, { income: number; expenses: number }>();
  for (const t of active) {
    const day = t.date;
    const entry = dateMap.get(day) ?? { income: 0, expenses: 0 };
    if (t.amount > 0 || t.type === 'income') {
      entry.income += Math.abs(t.amount);
    } else {
      entry.expenses += Math.abs(t.amount);
    }
    dateMap.set(day, entry);
  }

  const dailyBalances: DailyBalance[] = [];
  let runningBalance = 0;
  const sortedDates = Array.from(dateMap.keys()).sort();
  for (const date of sortedDates) {
    const entry = dateMap.get(date)!;
    const net = entry.income - entry.expenses;
    runningBalance += net;
    dailyBalances.push({
      date,
      income: entry.income,
      expenses: entry.expenses,
      net,
      runningBalance,
    });
  }

  return { totalIncome, totalExpenses, netFlow, incomeVsExpenseRatio, dailyBalances };
}
