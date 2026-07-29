"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { RetirementReadiness } from './planningTypes';

interface RetirementPlannerProps {
  userId: string;
  className?: string;
}

export function RetirementPlanner({ userId, className = '' }: RetirementPlannerProps) {
  const [age, setAge] = useState(65);
  const [contribution, setContribution] = useState(500);
  const [returnRate, setReturnRate] = useState(0.07);
  const [inflationRate, setInflationRate] = useState(0.03);

  const readiness = useMemo(() => {
    return calculateRetirementReadiness(age, contribution, returnRate, inflationRate);
  }, [age, contribution, returnRate, inflationRate]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Retirement Planner</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Retirement Age</label>
          <input type="number" value={age} onChange={(e) => setAge(Math.max(50, Math.min(90, Number(e.target.value))))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
        </div>
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
        {readiness && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Readiness Score</span>
              <span className={`text-lg font-bold ${readiness.score >= 80 ? 'text-emerald-600' : readiness.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{readiness.score}/100</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Years to Retire: <span className="font-semibold text-slate-900 dark:text-slate-100">{readiness.yearsToRetire}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Projected Nest Egg: <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">${readiness.projectedNestEgg.toLocaleString()}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Monthly Income: <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">${readiness.monthlyIncome.toLocaleString()}</span></div>
              <div className="min-w-0 text-slate-600 dark:text-slate-400">Income Target: <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">${readiness.incomeTarget.toLocaleString()}</span></div>
            </div>
            <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${readiness.score}%` }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface RetirementReadinessLocal {
  score: number;
  yearsToRetire: number;
  projectedNestEgg: number;
  monthlyIncome: number;
  incomeTarget: number;
}

function calculateRetirementReadiness(age: number, contribution: number, returnRate: number, inflationRate: number): RetirementReadinessLocal | null {
  const yearsToRetire = Math.max(0, age - 25);
  if (yearsToRetire <= 0 || contribution <= 0) return null;
  const monthlyContribution = contribution * 12;
  const realReturn = (1 + returnRate) / (1 + inflationRate) - 1;
  const projectedNestEgg = monthlyContribution * ((Math.pow(1 + realReturn / 12, yearsToRetire * 12) - 1) / (realReturn / 12));
  const safeWithdrawalRate = 0.04;
  const monthlyIncome = projectedNestEgg * safeWithdrawalRate / 12;
  const incomeTarget = monthlyContribution * 10;
  const score = Math.min(100, Math.round((monthlyIncome / incomeTarget) * 100));
  return { score: Math.max(0, score), yearsToRetire, projectedNestEgg: Math.round(projectedNestEgg), monthlyIncome: Math.round(monthlyIncome), incomeTarget };
}