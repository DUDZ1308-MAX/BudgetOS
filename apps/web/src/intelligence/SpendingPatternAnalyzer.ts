import type { SpendingPattern, IntelligenceInput } from './types';

export function analyzeSpendingPatterns(input: IntelligenceInput): SpendingPattern {
  const transactions = input.transactions;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0;
  });

  const lastMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    const lastM = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastY = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === lastM && d.getFullYear() === lastY && t.amount < 0;
  });

  const weeklyAverage = computeAverage(thisMonthTxns.map((t) => Math.abs(t.amount)));

  const weekendTxns = thisMonthTxns.filter((t) => {
    const d = new Date(t.date);
    const day = d.getDay();
    return day === 0 || day === 6;
  });
  const weekdayTxns = thisMonthTxns.filter((t) => {
    const d = new Date(t.date);
    const day = d.getDay();
    return day >= 1 && day <= 5;
  });
  const weekendSpending = weekendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const weekdaySpending = weekdayTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const categoryTrends = buildCategoryTrends(thisMonthTxns, lastMonthTxns);
  const recurringMerchants = findRecurringMerchants(transactions);

  return {
    weeklyAverage,
    weekendSpending,
    weekdaySpending,
    categoryTrends,
    recurringMerchants,
  };
}

function computeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function buildCategoryTrends(
  current: IntelligenceInput['transactions'],
  previous: IntelligenceInput['transactions'],
): SpendingPattern['categoryTrends'] {
  const currentByCat = aggregateByCategory(current);
  const previousByCat = aggregateByCategory(previous);
  const allCats = new Set([...Object.keys(currentByCat), ...Object.keys(previousByCat)]);

  return Array.from(allCats).map((category) => {
    const currentMonth = currentByCat[category] ?? 0;
    const previousMonth = previousByCat[category] ?? 0;
    const change = previousMonth > 0
      ? ((currentMonth - previousMonth) / previousMonth) * 100
      : currentMonth > 0 ? 100 : 0;
    return { category, currentMonth, previousMonth, change: Math.round(change) };
  });
}

function aggregateByCategory(txns: IntelligenceInput['transactions']): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of txns) {
    const cat = t.category || 'Uncategorized';
    result[cat] = (result[cat] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

function findRecurringMerchants(
  transactions: IntelligenceInput['transactions'],
): SpendingPattern['recurringMerchants'] {
  const merchantMap = new Map<string, { amounts: number[]; dates: string[] }>();

  for (const t of transactions) {
    if (!t.merchant) continue;
    const existing = merchantMap.get(t.merchant);
    if (existing) {
      existing.amounts.push(Math.abs(t.amount));
      existing.dates.push(t.date);
    } else {
      merchantMap.set(t.merchant, { amounts: [Math.abs(t.amount)], dates: [t.date] });
    }
  }

  const recurring: SpendingPattern['recurringMerchants'] = [];
  for (const [merchant, data] of merchantMap) {
    if (data.amounts.length >= 2) {
      const avgAmount = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length;
      const sortedDates = data.dates.sort();
      const frequency = estimateFrequency(sortedDates);
      recurring.push({
        merchant,
        averageAmount: Math.round(avgAmount),
        frequency,
        lastDate: sortedDates[sortedDates.length - 1]!,
      });
    }
  }

  return recurring.sort((a, b) => b.averageAmount - a.averageAmount).slice(0, 10);
}

function estimateFrequency(dates: string[]): string {
  if (dates.length < 2) return 'unknown';
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i - 1]!).getTime();
    const d2 = new Date(dates[i]!).getTime();
    gaps.push(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  if (avgGap <= 2) return 'daily';
  if (avgGap <= 5) return 'weekly';
  if (avgGap <= 18) return 'bi-weekly';
  if (avgGap <= 40) return 'monthly';
  if (avgGap <= 100) return 'quarterly';
  return 'occasional';
}
