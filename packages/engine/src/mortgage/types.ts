import type { ExtraPayment, AmortizationRow, ScenarioResult } from '@budgetos/shared';

export interface MortgageInput {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments: ExtraPayment[];
}

export interface ScenarioInput {
  label: string;
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments: ExtraPayment[];
}

export interface ScenarioComparison {
  scenarios: ScenarioResult[];
  bestPayoffDate: string;
  bestInterestSaved: number;
}

export { AmortizationRow, ScenarioResult, ExtraPayment };
