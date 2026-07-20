import {
  computeMortgage as computeMortgageLib,
} from '@/lib/finance/mortgage';
import type {
  PaymentFrequency,
} from '@/lib/finance/mortgage';
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
  extraPayments?: { amount: number; date?: string; month?: number; startMonth?: number; type?: string }[];
}): MortgageResult | null {
  const amortizationYears = input.amortizationYears ?? input.termYears;
  const frequency = (input.paymentFrequency ?? 'monthly') as PaymentFrequency;
  const isCompoundSemiAnnual = input.compoundSemiAnnual !== false;

  const extraPayments = (input.extraPayments ?? []).map((ep) => {
    const type = ep.type ?? 'one_time';
    if (type === 'one_time') {
      return { type: 'one_time' as const, amount: ep.amount, startMonth: (ep as any).startMonth ?? ep.month ?? 1 };
    }
    if (type === 'monthly_fixed') {
      return { type: 'monthly_fixed' as const, amount: ep.amount };
    }
    if (type === 'annual_lump') {
      return { type: 'annual_lump' as const, amount: ep.amount };
    }
    return { type: 'one_time' as const, amount: ep.amount, startMonth: (ep as any).startMonth ?? 1 };
  });

  const result = computeMortgageLib({
    principal: input.principal,
    annualRate: input.annualRate,
    amortizationYears,
    termYears: input.termYears,
    startDate: input.startDate,
    paymentFrequency: frequency,
    extraPayments,
    isCompoundSemiAnnual,
  });

  if (!result) return null;

  return {
    paymentAmount: result.paymentAmount,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    payoffMonths: result.payoffMonths,
    paymentFrequency: frequency,
    monthlyEquivalent: result.monthlyEquivalent,
    effectiveAnnualRate: result.effectiveAnnualRate,
    interestSaved: result.interestSaved,
    schedule: result.schedule.map((row) => ({
      month: row.paymentNumber,
      date: row.date,
      payment: row.payment,
      principal: row.principal,
      interest: row.interest,
      totalInterestToDate: row.cumulativeInterest,
      remainingBalance: row.remainingBalance,
      extraPayment: row.extraPayment,
    })),
  };
}

export function computeMortgageDashboard(result: MortgageResult): MortgageDashboard {
  const startDate = result.schedule.length > 0
    ? result.schedule[0]!.date
    : new Date().toISOString().slice(0, 10);
  const now = new Date();
  const start = new Date(startDate);
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const currentPaymentIndex = Math.min(
    Math.max(0, monthsElapsed),
    result.schedule.length,
  );

  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  for (let i = 0; i < currentPaymentIndex; i++) {
    const row = result.schedule[i]!;
    cumulativePrincipal = Math.round((cumulativePrincipal + row.principal) * 100) / 100;
    cumulativeInterest = Math.round((cumulativeInterest + row.interest) * 100) / 100;
  }

  const remainingBalance = currentPaymentIndex > 0 && currentPaymentIndex <= result.schedule.length
    ? result.schedule[currentPaymentIndex - 1]!.remainingBalance
    : result.totalPrincipal;

  const principalPaid = cumulativePrincipal;
  const interestPaid = cumulativeInterest;
  const progressPct = result.totalPrincipal > 0
    ? Math.min(100, (principalPaid / result.totalPrincipal) * 100)
    : 0;
  const equityBuilt = principalPaid;

  return {
    monthlyPayment: result.paymentAmount,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    progressPct,
    remainingBalance,
    principalPaid,
    interestPaid,
    paidSoFar: { principal: principalPaid, interest: interestPaid },
    equityBuilt,
    originalAmount: result.totalPrincipal,
  };
}

export function monthDiff(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
}
