import {
  computeMonthlyPayment,
  computeInterestPortion,
  computePrincipalPortion,
} from '../shared/math';
import { addMonths } from '../shared/date';
import { validateMortgageInput } from '../shared/errors';
import { toMonthlyEquivalent } from '../shared/frequency';
import type { MortgageInput, AmortizationRow } from './types';
import type { EngineResult, EngineError } from '../shared/errors';
import { success, failure } from '../shared/errors';

export interface MortgageCalcResult {
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string;
  payoffMonths: number;
  interestSaved: number;
}

export function calculateFullAmortization(input: MortgageInput): EngineResult<MortgageCalcResult> {
  const validationError = validateMortgageInput(input.principal, input.annualRate, input.termYears);
  if (validationError) {
    return failure(validationError);
  }

  const monthlyRate = input.annualRate / 100 / 12;
  const totalMonths = input.termYears * 12;
  const basePayment = computeMonthlyPayment(input.principal, monthlyRate, totalMonths);
  const totalExtraMonthly = computeTotalExtraMonthly(input.extraPayments);
  const totalPayment = basePayment + totalExtraMonthly;

  const schedule: AmortizationRow[] = [];
  let balance = input.principal;
  let cumulativeInterest = 0;
  let payoffMonth = totalMonths;
  let payoffDate = '';

  for (let month = 1; month <= totalMonths; month++) {
    if (balance <= 0) {
      payoffMonth = month - 1;
      break;
    }

    const extraThisMonth = getExtraForMonth(input.extraPayments, month);
    const interestPortion = computeInterestPortion(balance, monthlyRate);
    const remainingAfterInterest = balance + interestPortion;

    let principalPortion: number;
    let actualPayment: number;

    if (remainingAfterInterest <= basePayment + extraThisMonth) {
      principalPortion = balance;
      actualPayment = interestPortion + principalPortion;
      balance = 0;
    } else {
      principalPortion = basePayment + extraThisMonth - interestPortion;
      actualPayment = basePayment + extraThisMonth;
      balance -= principalPortion;
    }

    cumulativeInterest += interestPortion;
    const currentDate = addMonths(input.startDate, month - 1);

    schedule.push({
      month,
      date: currentDate,
      payment: actualPayment,
      principal: principalPortion,
      interest: interestPortion,
      totalInterestToDate: cumulativeInterest,
      remainingBalance: balance,
      extraPayment: extraThisMonth,
    });

    payoffDate = currentDate;
  }

  if (balance > 0 && schedule.length > 0) {
    const last = schedule[schedule.length - 1]!;
    last.principal += balance;
    last.payment += balance;
    last.remainingBalance = 0;
    cumulativeInterest = last.totalInterestToDate;
    balance = 0;
  }

  const totalPrincipal = input.principal;
  const totalInterest = cumulativeInterest;
  const baselineInterest = computeBaselineInterest(input);

  return success({
    monthlyPayment: basePayment,
    schedule,
    totalPayments: schedule.length,
    totalPrincipal,
    totalInterest,
    payoffDate,
    payoffMonths: schedule.length,
    interestSaved: baselineInterest - totalInterest,
  });
}

function normalizeExtraAmount(amount: number, type: MortgageInput['extraPayments'][number]['type']): number {
  if (type === 'biweekly') {
    return toMonthlyEquivalent(amount, 'biweekly');
  }
  return amount;
}

function computeTotalExtraMonthly(extraPayments: MortgageInput['extraPayments']): number {
  let total = 0;
  for (const ep of extraPayments) {
    if (ep.type === 'monthly_fixed' || ep.type === 'biweekly') {
      total += normalizeExtraAmount(ep.amount, ep.type);
    }
  }
  return total;
}

function getExtraForMonth(extraPayments: MortgageInput['extraPayments'], month: number): number {
  let extra = 0;
  for (const ep of extraPayments) {
    if (ep.type === 'monthly_fixed') {
      extra += ep.amount;
    } else if (ep.type === 'annual_lump' && month % 12 === 0) {
      extra += ep.amount;
    } else if (ep.type === 'one_time' && ep.startMonth === month) {
      extra += ep.amount;
    } else if (ep.type === 'biweekly') {
      extra += normalizeExtraAmount(ep.amount, ep.type);
    }
  }
  return extra;
}

function computeBaselineInterest(input: MortgageInput): number {
  const monthlyRate = input.annualRate / 100 / 12;
  const totalMonths = input.termYears * 12;
  const payment = computeMonthlyPayment(input.principal, monthlyRate, totalMonths);

  let balance = input.principal;
  let totalInterest = 0;

  for (let month = 1; month <= totalMonths; month++) {
    if (balance <= 0) break;
    const interestPortion = computeInterestPortion(balance, monthlyRate);
    const principalPortion = balance + interestPortion <= payment
      ? balance
      : payment - interestPortion;
    balance -= principalPortion;
    totalInterest += interestPortion;
  }

  return totalInterest;
}
