import type {
  DebtForecastInput,
  DebtPayoffPoint,
  DebtScenarioResult,
  DebtForecastResult,
} from '@budgetos/shared';
import { addMonths } from '../shared/date';

function simulateDebtPayoff(
  debts: DebtForecastInput[],
  getPayment: (debt: DebtForecastInput, totalMinimum: number) => number,
  maxMonths: number,
): DebtScenarioResult {
  const balances = debts.map((d) => ({ ...d, balance: d.balance }));
  const points: DebtPayoffPoint[] = [];
  const startDate = new Date().toISOString().slice(0, 10);
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let payoffMonth: number | null = null;
  const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);

  for (let month = 1; month <= maxMonths; month++) {
    let totalBalance = 0;
    let monthInterest = 0;
    let monthPrincipal = 0;

    for (const d of balances) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      let payment = getPayment(d, totalMinimum);
      payment = Math.min(payment, d.balance + interest);

      const principal = payment - interest;
      d.balance = Math.max(0, d.balance - principal);
      totalBalance += d.balance;
      monthInterest += interest;
      monthPrincipal += principal;
    }

    totalInterestPaid += monthInterest;
    totalPrincipalPaid += monthPrincipal;

    points.push({
      date: addMonths(startDate, month - 1),
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
    });

    if (totalBalance <= 0 && payoffMonth === null) {
      payoffMonth = month;
    }
    if (totalBalance <= 0) {
      for (let remaining = month; remaining < maxMonths; remaining++) {
        points.push({
          date: addMonths(startDate, remaining - 1),
          totalBalance: 0,
          totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
          totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
        });
      }
      break;
    }
  }

  const payoffDate = payoffMonth ? addMonths(startDate, payoffMonth - 1) : null;
  return {
    label: '',
    points,
    payoffDate,
    totalInterest: Math.round(totalInterestPaid * 100) / 100,
    totalPayments: Math.round((totalPrincipalPaid + totalInterestPaid) * 100) / 100,
    monthsToPayoff: payoffMonth ?? maxMonths,
  };
}

export function computeDebtForecast(
  debts: DebtForecastInput[],
  maxMonths: number = 360, // 30 years max
  acceleratedMultiplier: number = 1.5,
): DebtForecastResult {
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  if (totalBalance <= 0) {
    return {
      inputs: debts,
      scenarios: {
        minimum: {
          label: 'Minimum Payments',
          points: [],
          payoffDate: new Date().toISOString().slice(0, 10),
          totalInterest: 0,
          totalPayments: 0,
          monthsToPayoff: 0,
        },
        accelerated: {
          label: 'Accelerated Payments',
          points: [],
          payoffDate: new Date().toISOString().slice(0, 10),
          totalInterest: 0,
          totalPayments: 0,
          monthsToPayoff: 0,
        },
      },
      debtFreeDate: new Date().toISOString().slice(0, 10),
      interestSaved: 0,
      usingAccelerated: false,
    };
  }

  const totalActual = debts.reduce((s, d) => s + d.actualPayment, 0);

  const minimumScenario = simulateDebtPayoff(
    debts,
    (debt) => debt.minimumPayment,
    maxMonths,
  );
  minimumScenario.label = 'Minimum Payments';

  const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const getAcceleratedPayment = (debt: DebtForecastInput): number => {
    const actual = debt.actualPayment;
    const min = debt.minimumPayment;
    const accelerated = Math.max(actual, min * acceleratedMultiplier);
    const proportionalShare = totalMinimum > 0 ? min / totalMinimum : 1 / debts.length;
    const extraTotal = totalActual - totalMinimum;
    return accelerated + extraTotal * proportionalShare;
  };

  const acceleratedScenario = simulateDebtPayoff(
    debts,
    getAcceleratedPayment,
    maxMonths,
  );
  acceleratedScenario.label = 'Accelerated Payments';

  const interestSaved = Math.max(0, minimumScenario.totalInterest - acceleratedScenario.totalInterest);
  const debtFreeDate = acceleratedScenario.payoffDate ?? minimumScenario.payoffDate;

  return {
    inputs: debts,
    scenarios: { minimum: minimumScenario, accelerated: acceleratedScenario },
    debtFreeDate,
    interestSaved: Math.round(interestSaved * 100) / 100,
    usingAccelerated: interestSaved > 0,
  };
}
