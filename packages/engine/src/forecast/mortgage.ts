import type { MortgageForecastPoint, MortgageForecastResult } from '@budgetos/shared';
import { calculateFullAmortization } from '../mortgage/calculator';
import type { MortgageInput } from '../mortgage/types';

export interface MortgageForecastInput {
  id: string;
  name: string;
  principal: number;
  annualRate: number;
  termYears: number;
  amortizationYears?: number;
  startDate: string;
  extraPayments?: MortgageInput['extraPayments'];
  monthsElapsed?: number;
}

export function computeMortgageForecast(input: MortgageForecastInput): MortgageForecastResult | null {
  const calcInput: MortgageInput = {
    principal: input.principal,
    annualRate: input.annualRate,
    termYears: input.termYears,
    amortizationYears: input.amortizationYears ?? input.termYears,
    startDate: input.startDate,
    extraPayments: input.extraPayments ?? [],
  };

  const result = calculateFullAmortization(calcInput);
  if (!result.success || !result.data) return null;

  const { schedule, monthlyPayment, totalInterest, payoffDate, payoffMonths, interestSaved } = result.data;

  const monthsElapsed = input.monthsElapsed ?? 0;
  const points: MortgageForecastPoint[] = [];

  for (const row of schedule) {
    if (row.month <= monthsElapsed) continue;

    let equity = 0;
    for (const prev of schedule) {
      if (prev.month >= row.month) break;
      equity += prev.principal;
    }

    points.push({
      date: row.date,
      remainingBalance: Math.round(row.remainingBalance * 100) / 100,
      principalPaid: Math.round(equity * 100) / 100,
      interestPaid: Math.round(row.totalInterestToDate * 100) / 100,
      cumulativeInterest: Math.round(row.totalInterestToDate * 100) / 100,
      equity: Math.round(equity * 100) / 100,
    });
  }

  const baselineCalc = calculateFullAmortization({
    ...calcInput,
    extraPayments: [],
  });
  const baselineInterest = baselineCalc.success ? baselineCalc.data!.totalInterest : totalInterest;
  const actualInterest = totalInterest;

  return {
    id: input.id,
    name: input.name,
    monthlyPayment,
    originalPrincipal: input.principal,
    currentBalance: schedule.find((r) => r.month === Math.max(1, monthsElapsed))?.remainingBalance ?? input.principal,
    annualRate: input.annualRate,
    points,
    baselineInterest: Math.round(baselineInterest * 100) / 100,
    projectedInterest: Math.round(actualInterest * 100) / 100,
    interestSaved: Math.round(interestSaved * 100) / 100,
    payoffDate: payoffDate ?? null,
    payoffMonths,
    yearsRemaining: Math.round((payoffMonths - monthsElapsed) / 12 * 10) / 10,
  };
}
