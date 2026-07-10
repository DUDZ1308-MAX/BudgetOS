import type { TrendData, IntelligenceInput } from './types';

export function analyzeTrends(input: IntelligenceInput): TrendData {
  const dailyBalances = input.cashFlowSummary.dailyBalances.map((d) => d.runningBalance);
  const weeklyAverages = computeWeeklyAverages(dailyBalances);
  const monthlyAverages = computeMonthlyAverages(dailyBalances);

  return {
    dailyBalances,
    weeklyAverages,
    monthlyAverages,
    trend: classifyTrend(dailyBalances),
    volatility: computeVolatility(dailyBalances),
  };
}

function computeWeeklyAverages(dailyData: number[]): number[] {
  const weeks: number[] = [];
  for (let i = 0; i < dailyData.length; i += 7) {
    const week = dailyData.slice(i, i + 7);
    if (week.length > 0) {
      weeks.push(week.reduce((s, v) => s + v, 0) / week.length);
    }
  }
  return weeks;
}

function computeMonthlyAverages(dailyData: number[]): number[] {
  const months: number[] = [];
  for (let i = 0; i < dailyData.length; i += 30) {
    const month = dailyData.slice(i, i + 30);
    if (month.length > 0) {
      months.push(month.reduce((s, v) => s + v, 0) / month.length);
    }
  }
  return months;
}

function classifyTrend(data: number[]): 'improving' | 'declining' | 'stable' {
  if (data.length < 2) return 'stable';
  const first = data[0]!;
  const last = data[data.length - 1]!;
  const change = last - first;
  const pctChange = first !== 0 ? change / Math.abs(first) : 0;
  if (pctChange > 0.05) return 'improving';
  if (pctChange < -0.05) return 'declining';
  return 'stable';
}

function computeVolatility(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
}
