"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FinancialEngine } from '@/services/FinancialEngine';
import { RETIREMENT } from '@budgetos/shared';

interface RetirementPlannerProps {
  userId: string;
  className?: string;
}

function pluralYears(years: number): string {
  return years === 1 ? '1 year' : `${years} years`;
}

export function RetirementPlanner({ userId, className = '' }: RetirementPlannerProps) {
  const [currentAgeInput, setCurrentAgeInput] = useState('30');
  const [retirementAgeInput, setRetirementAgeInput] = useState('65');
  const [contribution, setContribution] = useState(500);
  const [returnRate, setReturnRate] = useState(0.07);
  const [inflationRate, setInflationRate] = useState(0.03);

  const parsed = useMemo(() => {
    const currentAge = currentAgeInput.trim() === '' ? null : Number(currentAgeInput);
    const retirementAge = retirementAgeInput.trim() === '' ? null : Number(retirementAgeInput);
    if (currentAge === null || retirementAge === null) {
      return { valid: false as const, message: 'Enter your current age and target retirement age.' };
    }
    if (!Number.isFinite(currentAge) || !Number.isFinite(retirementAge)) {
      return { valid: false as const, message: 'Please enter valid ages.' };
    }
    if (currentAge < RETIREMENT.MIN_AGE || retirementAge < RETIREMENT.MIN_AGE) {
      return { valid: false as const, message: 'Ages cannot be negative.' };
    }
    if (currentAge > RETIREMENT.MAX_AGE) {
      return { valid: false as const, message: `Please enter a realistic current age (max ${RETIREMENT.MAX_AGE}).` };
    }
    if (retirementAge < RETIREMENT.MIN_RETIREMENT_AGE) {
      return { valid: false as const, message: `Retirement age must be at least ${RETIREMENT.MIN_RETIREMENT_AGE}.` };
    }
    if (retirementAge > RETIREMENT.MAX_RETIREMENT_AGE) {
      return { valid: false as const, message: `Please enter a realistic retirement age (max ${RETIREMENT.MAX_RETIREMENT_AGE}).` };
    }
    if (currentAge > retirementAge) {
      return { valid: false as const, message: 'Your current age cannot be greater than your retirement age.' };
    }
    return { valid: true as const, currentAge, retirementAge };
  }, [currentAgeInput, retirementAgeInput]);

  const plan = useMemo(() => {
    if (!parsed.valid) return null;
    return FinancialEngine.getRetirementPlan({
      currentAge: parsed.currentAge,
      retirementAge: parsed.retirementAge,
      monthlyContribution: contribution,
      annualReturnRate: returnRate,
      inflationRate,
    });
  }, [parsed, contribution, returnRate, inflationRate]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Retirement Planner</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Age</label>
            <input type="number" min={RETIREMENT.MIN_AGE} max={RETIREMENT.MAX_AGE} value={currentAgeInput} onChange={(e) => setCurrentAgeInput(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" placeholder="e.g. 38" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Retirement Age</label>
            <input type="number" min={RETIREMENT.MIN_RETIREMENT_AGE} max={RETIREMENT.MAX_RETIREMENT_AGE} value={retirementAgeInput} onChange={(e) => setRetirementAgeInput(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" placeholder="e.g. 65" />
          </div>
        </div>

        {!parsed.valid && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{parsed.message}</p>
        )}

        {plan && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Years Until Retirement</span>
              <span className="mt-1 block text-2xl font-bold text-slate-900 dark:text-slate-100">{pluralYears(plan.yearsUntilRetirement)}</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Estimated Retirement</span>
              <span className="mt-1 block text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.estimatedRetirementYear}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Contribution</label>
          <input type="number" value={contribution} onChange={(e) => setContribution(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Annual Return</label>
          <input type="number" step="0.01" value={returnRate} onChange={(e) => setReturnRate(Math.max(0, Math.min(0.2, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inflation Rate</label>
          <input type="number" step="0.01" value={inflationRate} onChange={(e) => setInflationRate(Math.max(0, Math.min(0.1, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
        </div>

        {plan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {plan.isAtRetirementAge && (
              <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {plan.passedRetirementAge ? 'You have already passed your target retirement age.' : "You're at your target retirement age."}
              </p>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Readiness Score</span>
              <span className={`text-lg font-bold ${plan.readinessScore >= 80 ? 'text-emerald-600' : plan.readinessScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{plan.readinessScore}/100</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Years Until Retirement: <span className="font-semibold text-slate-900 dark:text-slate-100">{pluralYears(plan.yearsUntilRetirement)}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Estimated Retirement: <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.estimatedRetirementYear}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Projected Nest Egg: <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">${plan.projectedNestEgg.toLocaleString()}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Monthly Income: <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">${plan.monthlyIncome.toLocaleString()}</span></div>
            </div>
            <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${plan.readinessScore}%` }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
