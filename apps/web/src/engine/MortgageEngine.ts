import { calculateFullAmortization } from '@budgetos/engine';
import type { AmortizationRow } from '@budgetos/shared';

export interface MortgageResult {
  paymentAmount: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  payoffMonths: number;
  paymentFrequency: string;
  monthlyEquivalent: number;
  effectiveAnnualRate: number;
  interestSaved: number;
  schedule: AmortizationRow[];
}

export interface MortgageDashboard {
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  progressPct: number;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
  paidSoFar: { principal: number; interest: number };
  equityBuilt: number;
  originalAmount: number;
}

export function computeMortgage(input: {
  principal: number;
  annualRate: number;
  termYears: number;
  amortizationYears?: number;
  startDate: string;
  paymentFrequency?: string;
  compoundSemiAnnual?: boolean;
  extraPayments?: { amount: number; date?: string; month?: number; type?: string }[];
}): MortgageResult | null {
  const extraPayments = (input.extraPayments ?? []).map((ep) => {
    const type = ep.type ?? 'one_time';
    if (type === 'one_time' || ep.month != null) {
      return { type: 'one_time' as const, amount: ep.amount, startMonth: ep.month ?? 1 };
    }
    if (type === 'monthly_fixed') {
      return { type: 'monthly_fixed' as const, amount: ep.amount };
    }
    if (type === 'annual_lump') {
      return { type: 'annual_lump' as const, amount: ep.amount };
    }
    return { type: 'one_time' as const, amount: ep.amount, startMonth: 1 };
  });

  const result = calculateFullAmortization({
    principal: input.principal,
    annualRate: input.annualRate,
    termYears: input.termYears,
    startDate: input.startDate,
    extraPayments: extraPayments && extraPayments.length > 0 ? extraPayments : [],
  });

  if (!result.success) return null;

  const data = result.data;
  const frequency = input.paymentFrequency ?? 'monthly';

  const paymentsPerYear = frequency === 'monthly' ? 12
    : frequency === 'semi_monthly' ? 24
    : frequency === 'bi_weekly' || frequency === 'accelerated_bi_weekly' ? 26
    : frequency === 'weekly' || frequency === 'accelerated_weekly' ? 52
    : 12;

  const monthlyEquivalent = frequency === 'monthly' ? data.monthlyPayment
    : (data.monthlyPayment * paymentsPerYear) / 12;

  const n = input.compoundSemiAnnual !== false ? 2 : 12;
  const effectiveAnnualRate = Math.pow(1 + (input.annualRate / 100) / n, n) - 1;

  let interestSaved = 0;
  if (extraPayments.length > 0) {
    const baseline = calculateFullAmortization({
      principal: input.principal,
      annualRate: input.annualRate,
      termYears: input.termYears,
      startDate: input.startDate,
      extraPayments: [],
    });
    if (baseline.success) {
      interestSaved = baseline.data.totalInterest - data.totalInterest;
    }
  }

  return {
    paymentAmount: data.monthlyPayment,
    totalPrincipal: input.principal,
    totalInterest: data.totalInterest,
    payoffDate: data.payoffDate,
    payoffMonths: data.payoffMonths,
    paymentFrequency: frequency,
    monthlyEquivalent,
    effectiveAnnualRate,
    interestSaved,
    schedule: data.schedule,
  };
}

export function computeMortgageDashboard(result: MortgageResult): MortgageDashboard {
  const lastRow = result.schedule.length > 0 ? result.schedule[result.schedule.length - 1] : undefined;
  const remainingBalance = lastRow ? lastRow.remainingBalance : result.totalPrincipal;
  const principalPaid = result.totalPrincipal - remainingBalance;
  const progressPct = (principalPaid / result.totalPrincipal) * 100;
  const equityBuilt = principalPaid;
  const paidSoFar = { principal: principalPaid, interest: result.totalInterest - (result.totalPrincipal - principalPaid) };

  return {
    monthlyPayment: result.paymentAmount,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    progressPct,
    remainingBalance,
    principalPaid,
    interestPaid: result.totalInterest,
    paidSoFar,
    equityBuilt,
    originalAmount: result.totalPrincipal,
  };
}

export function monthDiff(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
}
