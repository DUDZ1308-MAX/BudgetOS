import { computeMortgage as computeMortgageNew, computeMortgageDashboard as computeMortgageDashboardNew } from '@/lib/finance';
import type { MortgageInput, ExtraPaymentInput, MortgageResult } from '@/lib/finance';

export type MortgageCalcResult = MortgageResult;

export interface OldMortgageDashboard {
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  progressPct: number;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
}

export function computeMortgage(input: {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments?: { amount: number; date?: string; month?: number }[];
}): MortgageResult | null {
  const extraPayments: ExtraPaymentInput[] | undefined = input.extraPayments?.map((ep) => {
    if (ep.month != null) return { month: ep.month, amount: ep.amount };
    return { month: 1, amount: ep.amount };
  });

  return computeMortgageNew({
    principal: input.principal,
    annualRate: input.annualRate,
    termYears: input.termYears,
    startDate: input.startDate,
    extraPayments: extraPayments && extraPayments.length > 0 ? extraPayments : undefined,
  });
}

export function computeMortgageDashboard(result: MortgageResult): OldMortgageDashboard {
  const dashboard = computeMortgageDashboardNew(result);
  const paidSoFar = result.schedule.reduce(
    (acc, row) => {
      if (row.remainingBalance > 0) {
        acc.principal += row.principal;
        acc.interest += row.interest;
      }
      return acc;
    },
    { principal: 0, interest: 0 },
  );

  return {
    monthlyPayment: result.monthlyPayment,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    progressPct: dashboard.progressPct,
    remainingBalance: dashboard.remainingBalance,
    principalPaid: Math.round(paidSoFar.principal * 100) / 100,
    interestPaid: Math.round(paidSoFar.interest * 100) / 100,
  };
}

export { monthDiff } from '@/lib/finance';
