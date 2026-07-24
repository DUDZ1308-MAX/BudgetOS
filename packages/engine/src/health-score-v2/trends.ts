import { computeTrend } from './utils';
import type { TrendAnalysisRequest, TrendAnalysisResult, TrendItem, TrendPeriod } from './types';

export function analyzeTrends(request: TrendAnalysisRequest): TrendAnalysisResult {
  const healthScorePeriods = buildPeriods(request.healthScoreHistory.map((h: { score: number; date: string }) => ({ value: h.score, date: h.date })));
  const spendingPeriods = buildMedianPeriods(request.transactions.map((t: { date: string; amount: number }) => ({ value: t.amount, date: t.date })));
  const savingsPeriods = buildPeriods(request.savingsHistory.map((h: { amount: number; date: string }) => ({ value: h.amount, date: h.date })));
  const netWorthPeriods = buildPeriods(request.netWorthHistory.map((h: { netWorth: number; date: string }) => ({ value: h.netWorth, date: h.date })));
  const debtPeriods = buildMedianPeriods(
    request.transactions.filter((t: { type: string }) => t.type === 'expense').map((t: { date: string; amount: number }) => ({ value: t.amount, date: t.date })),
  );

  return {
    healthScore: buildTrendItem(healthScorePeriods, request.healthScoreHistory.map((h: { score: number }) => h.score)),
    spending: buildTrendItem(spendingPeriods, extractValues(spendingPeriods)),
    savings: buildTrendItem(savingsPeriods, request.savingsHistory.map((h: { amount: number }) => h.amount)),
    netWorth: buildTrendItem(netWorthPeriods, request.netWorthHistory.map((h: { netWorth: number }) => h.netWorth)),
    debt: buildTrendItem(debtPeriods, extractValues(debtPeriods)),
    cashFlow: buildCashFlowTrend(request.transactions, request.recurrings),
  };
}

interface ValueDate {
  value: number;
  date: string;
}

function buildPeriods(data: ValueDate[]): TrendPeriod[] {
  if (data.length === 0) return [];
  const now = new Date();
  const periods: TrendPeriod[] = [];
  for (const interval of [30, 90, 180, 365]) {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - interval);
    const inRange = data.filter(d => new Date(d.date) >= cutoff);
    if (inRange.length > 0) {
      const avg = inRange.reduce((s, d) => s + d.value, 0) / inRange.length;
      const startDate = cutoff.toISOString().slice(0, 10);
      const endDate = now.toISOString().slice(0, 10);
      periods.push({
        label: `${interval}d`,
        value: Math.round(avg * 100) / 100,
        startDate,
        endDate,
      });
    }
  }
  return periods;
}

function buildMedianPeriods(transactions: ValueDate[]): TrendPeriod[] {
  return buildPeriods(transactions);
}

function extractValues(periods: TrendPeriod[]): number[] {
  return periods.map(p => p.value);
}

function buildTrendItem(periods: TrendPeriod[], values: number[]): TrendItem {
  const direction = computeTrend(values);
  const change = periods.length >= 2 ? periods[periods.length - 1]!.value - periods[0]!.value : 0;
  const changePercent = periods.length >= 2 && periods[0]!.value !== 0
    ? ((periods[periods.length - 1]!.value - periods[0]!.value) / Math.abs(periods[0]!.value)) * 100
    : 0;
  return { direction, change, changePercent: Math.round(changePercent * 100) / 100, periods };
}

function buildCashFlowTrend(
  transactions: Array<{ date: string; amount: number; categoryId: string; type: string }>,
  _recurrings: Array<{ amount: number; type: string; frequency: string; next_run: string }>,
): TrendItem {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expenses;
  return {
    direction: net >= 0 ? 'improving' : 'declining',
    change: net,
    changePercent: income > 0 ? Math.round((net / income) * 10000) / 100 : 0,
    periods: [],
  };
}
