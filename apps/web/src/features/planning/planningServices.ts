"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { 
  PlanningEvent, 
  TimelineView, 
  PlanningScenario,
  LifeEvent,
  PlanningSettings,
  PlanningDashboard,
  RetirementReadiness,
  InvestmentProgress,
  DebtProgress,
  GoalProgress,
  ForecastSnapshot
} from './planningTypes';

// ============================================================================
// Planning Engine Services - Wraps FinancialEngine for planning features
// ============================================================================

export function usePlanningEvents(userId: string, settings: PlanningSettings) {
  return useQuery({
    queryKey: ['planning-events', userId, settings],
    queryFn: async () => {
      // Fetch all data through FinancialEngine (SSOT)
      const [
        accounts,
        categories,
        budgets,
        transactions,
        recurrings,
        savings,
        mortgages,
      ] = await Promise.all([
        fetch(`/api/v1/accounts/${userId}`).then(r => r.json()),
        fetch(`/api/v1/categories/${userId}`).then(r => r.json()),
        fetch(`/api/v1/budgets/${userId}`).then(r => r.json()),
        fetch(`/api/v1/transactions/${userId}`).then(r => r.json()),
        fetch(`/api/v1/recurring/${userId}`).then(r => r.json()),
        fetch(`/api/v1/savings/${userId}`).then(r => r.json()),
        fetch(`/api/v1/mortgages/${userId}`).then(r => r.json()),
      ]);

      // Process events through FinancialEngine methods
      const allEvents = [];
      
      // 1. Paydays (using recurring income)
      const paydayEvents = recurrings
        .filter((r: any) => r.type === 'income' && r.frequency === 'monthly')
        .map((r: any) => createPlanningEvent({
          type: 'payday',
          date: `2025-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`,
          title: `Payday: ${r.name}`,
          amount: Number(r.amount),
          icon: '💰',
          category: 'income',
          source: 'deterministic',
          data: { recurringId: r.id }
        }));

      // 2. Bill payments (using recurring expenses)
      const billEvents = recurrings
        .filter((r: any) => r.type === 'expense')
        .map((r: any) => createPlanningEvent({
          type: 'bill',
          date: `2025-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
          title: `Bill: ${r.name}`,
          amount: Number(r.amount),
          icon: '📄',
          category: 'expense',
          source: 'deterministic',
          data: { recurringId: r.id }
        }));

      // 3. Mortgage payments
      const mortgageEvents = mortgages.map((m: any) => {
        const schedule = FinancialEngine.getMortgageSchedule(m);
        return createPlanningEvent({
          type: 'mortgage',
          date: `2025-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
          title: `${m.name} Payment`,
          amount: m.monthly_payment || 0,
          icon: '🏠',
          category: 'debt',
          source: 'deterministic',
          data: { mortgageId: m.id, schedule }
        });
      });

      // 4. Savings milestones
      const savingsEvents = savings.map((g: any) => {
        const goals = FinancialEngine.getSavingsGoals([g]);
        const goal = goals[0];
        if (goal.percentComplete >= 100) return null;
        
        const monthlyProgress = (goal.targetAmount - goal.currentAmount) / (goal.monthsRemaining || 1);
        const projectedCompletionDate = goal.estimatedCompletionDate;
        
        return createPlanningEvent({
          type: 'savings_milestone',
          date: projectedCompletionDate || '',
          title: `${g.name} Goal`,
          amount: goal.targetAmount - goal.currentAmount,
          icon: '🎯',
          category: 'savings',
          source: 'deterministic',
          status: 'upcoming',
          data: { goalId: g.id, current: goal.currentAmount, target: goal.targetAmount }
        });
      }).filter(Boolean);

      // 5. Credit card payments (using transactions)
      const creditCardEvents = transactions
        .filter((t: any) => t.category_name?.toLowerCase().includes('credit') || 
                           t.merchant?.toLowerCase().includes('credit'))
        .slice(0, 5) // Limit to recent
        .map((t: any) => createPlanningEvent({
          type: 'credit_card_payment',
          date: t.date,
          title: `Credit Card: ${t.merchant || 'Payment'}`,
          amount: Math.abs(Number(t.amount)),
          icon: '💳',
          category: 'expense',
          source: 'deterministic',
          data: { transactionId: t.id }
        }));

      // 6. Forecasts (using FinancialEngine projections)
      const projections = FinancialEngine.getProjections(
        FinancialEngine.getNetWorth(accounts).netWorth,
        savings.reduce((s: number, g: any) => s + Number(g.current_amount || 0), 0),
        FinancialEngine.getNetWorth(accounts).totalLiabilities,
        FinancialEngine.getCashFlow(transactions, recurrings, { start: '2025-01-01', end: '2025-12-31' }).monthlyIncome,
        FinancialEngine.getCashFlow(transactions, recurrings, { start: '2025-01-01', end: '2025-12-31' }).monthlyExpenses,
        FinancialEngine.getCashFlow(transactions, recurrings, { start: '2025-01-01', end: '2025-12-31' }).cashFlow / 
          Math.max(FinancialEngine.getCashFlow(transactions, recurrings, { start: '2025-01-01', end: '2025-12-31' }).monthlyIncome, 1),
        FinancialEngine.getAvailableCash(accounts),
        0, // debt_payment_monthly placeholder
        0.07, // expected_return_rate placeholder
        savings.map((g: any) => ({ monthlyContribution: Number(g.monthly_contribution || 0), targetAmount: Number(g.target_amount || 0) }))
      );n
      const forecastEvents = [];
      
      if (projections.mortgagePayoff) {
        forecastEvents.push(createPlanningEvent({
          type: 'mortgage_payoff',
          date: projections.mortgagePayoff.year + '-01-01',
          title: `Mortgage Payoff`,
          amount: 0,
          icon: '🏆',
          category: 'debt',
          source: 'forecast',
          isForecast: true,
          forecastConfidence: 0.85,
          data: { payoffDate: projections.mortgagePayoff.year, interestSaved: projections.interestSaved }
        }));
      }

      if (projections.savingsCompletion) {
        forecastEvents.push(createPlanningEvent({
          type: 'savings_completion',
          date: projections.savingsCompletion.year + '-01-01',
          title: `Savings Goal Completion`,
          amount: projections.savingsCompletion.goalAmount - FinancialEngine.getSavingsSnapshot(savings).totalSaved,
          icon: '💰',
          category: 'savings',
          source: 'forecast',
          isForecast: true,
          forecastConfidence: 0.90,
          data: { goalAmount: projections.savingsCompletion.goalAmount, completionYear: projections.savingsCompletion.year }
        }));
      }

      if (projections.retirementReadiness) {
        forecastEvents.push(createPlanningEvent({
          type: 'retirement_readiness',
          date: projections.retirementReadiness.year + '-01-01',
          title: `Retirement Ready`,
          amount: projections.retirementReadiness.netWorthAtRetirement,
          icon: '☀️',
          category: 'retirement',
          source: 'forecast',
          isForecast: true,
          forecastConfidence: 0.80,
          data: { retirementYear: projections.retirementReadiness.year, annualIncome: projections.retirementReadiness.annualIncome }
        }));
      }

      allEvents.push(...paydayEvents, ...billEvents, ...mortgageEvents, ...savingsEvents, ...creditCardEvents, ...forecastEvents);
      return allEvents;
    },
    select: (events) => events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlanningDashboard(userId: string) {
  return useQuery({
    queryKey: ['planning-dashboard', userId],
    queryFn: async (): Promise<PlanningDashboard> => {
      const [
        accounts,
        categories,
        budgets,
        transactions,
        recurrings,
        savings,
        mortgages,
      ] = await Promise.all([
        fetch(`/api/v1/accounts/${userId}`).then(r => r.json()),
        fetch(`/api/v1/categories/${userId}`).then(r => r.json()),
        fetch(`/api/v1/budgets/${userId}`).then(r => r.json()),
        fetch(`/api/v1/transactions/${userId}`).then(r => r.json()),
        fetch(`/api/v1/recurring/${userId}`).then(r => r.json()),
        fetch(`/api/v1/savings/${userId}`).then(r => r.json()),
        fetch(`/api/v1/mortgages/${userId}`).then(r => r.json()),
      ]);

      const netWorth = FinancialEngine.getNetWorth(accounts);
      const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, { start: '2025-01-01', end: '2025-12-31' });
      const budgetHealth = FinancialEngine.getBudgetHealth(budgets, transactions, categories, cashFlow.monthlyIncome);
      const healthScore = FinancialEngine.getHealthScoreV2(cashFlow, netWorth, budgetHealth, cashFlow.monthlyIncome / cashFlow.monthlyExpenses * 100, cashFlow.monthlyExpenses, savings);
      const savingsSnapshot = FinancialEngine.getSavingsSnapshot(savings);
      const monthlySavings = savings.reduce((s: number, g: any) => s + Number(g.monthly_contribution || 0), 0);
      
      const projections = FinancialEngine.getProjections(
        netWorth.netWorth,
        savingsSnapshot.totalSaved,
        netWorth.totalLiabilities,
        cashFlow.monthlyIncome,
        cashFlow.monthlyExpenses,
        cashFlow.cashFlow / Math.max(cashFlow.monthlyIncome, 1),
        FinancialEngine.getAvailableCash(accounts),
        0, // debt_payment_monthly
        0.07, // expected_return_rate
        savings.map((g: any) => ({ monthlyContribution: Number(g.monthly_contribution || 0), targetAmount: Number(g.target_amount || 0) }))
      );n
      const accountSummary = FinancialEngine.getAccountSummary(accounts);

      const dashboard: PlanningDashboard = {
        retirement: {
          ageToRetire: 65,
          currentSavings: savingsSnapshot.totalSaved,
          targetSavings: projections.retirementReadiness?.netWorthAtRetirement || 1000000,
          annualContribution: monthlySavings * 12,
          expectedReturnRate: 0.07,
          inflationRate: 0.03,
          retirementIncomeTarget: 50000,
          readinessScore: healthScore.overallScore > 80 ? 'good' : healthScore.overallScore > 60 ? 'fair' : 'poor',
          yearsToRetire: 65 - new Date().getFullYear(),
        } as RetirementReadiness,
        
        investments: {
          allocation: { stocks: 0.6, etfs: 0.2, mutualFunds: 0.1, bonds: 0.05, cash: 0.03, crypto: 0.02 },
          historicalReturns: [],
          targetReturns: 0.08,
          currentValue: accountSummary.investments,
          totalInvested: accountSummary.investments,
          growthRate: 0.07,
        } as InvestmentProgress,
        
        debt: {
          totalDebt: netWorth.totalLiabilities,
          totalPaid: 0,
          remainingBalance: netWorth.totalLiabilities,
          payoffDate: FinancialEngine.getProjections(netWorth.netWorth, savingsSnapshot.totalSaved, netWorth.totalLiabilities, cashFlow.monthlyIncome, cashFlow.monthlyExpenses, cashFlow.cashFlow / Math.max(cashFlow.monthlyIncome, 1), FinancialEngine.getAvailableCash(accounts), 0, 0.07, []).debtPayoff?.year || '2030-01-01',
          strategies: [
            { type: 'snowball', monthlyPayment: 500, interestRate: 0.05, payoffMonths: 360, interestPaid: 800, isOptimal: false },
            { type: 'avalanche', monthlyPayment: 500, interestRate: 0.05, payoffMonths: 360, interestPaid: 800, isOptimal: true },
          ],
          currentStrategy: 'avalanche',
        } as DebtProgress,
        
        timelinePreview: [],
        scenarioSummary: {
          activeScenarios: 0,
          scenarioComparisons: 0,
          bestPerformingScenario: 'current',
          worstPerformingScenario: 'minimal_savings',
        },
        
        goalProgress: savings.map((g: any) => ({
          id: g.id,
          name: g.name,
          currentValue: Number(g.current_amount || 0),
          targetValue: Number(g.target_amount || 0),
          deadline: g.target_date || '',
          progress: Number(g.percentComplete || 0),
          category: 'savings',
        } as GoalProgress)),
        
        forecastSnapshot: {
          netWorthProjection: projections.netWorthTrajectory?.map((p: any) => ({
            date: p.year + '-01-01',
            value: p.netWorth,
            cumulativeValue: p.netWorth,
          })) || [],
          cashFlowProjection: projections.cashFlowTrajectory?.map((p: any) => ({
            date: p.year + '-01-01',
            value: p.cashFlow,
            cumulativeValue: p.cumulativeCashFlow || 0,
          })) || [],
          debtPayoffProjection: [],
          savingsGoalProjection: [],
        } as ForecastSnapshot,
        
        quickActions: [
          { id: 'scenario-1', title: 'Add Extra Savings', description: 'Simulate adding $200/month', icon: '💰', action: 'scenario', category: 'savings', requiresConfirmation: false },
          { id: 'scenario-2', title: 'Accelerate Mortgage', description: 'Simulate extra mortgage payments', icon: '🏠', action: 'scenario', category: 'debt', requiresConfirmation: false },
          { id: 'retirement', title: 'Adjust Retirement Age', description: 'Update retirement planning', icon: '☀️', action: 'retirement', category: 'retirement', requiresConfirmation: false },
        ],
      };
      
      return dashboard;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlanningScenarios(userId: string) {
  return useQuery({
    queryKey: ['planning-scenarios', userId],
    queryFn: async () => {
      const [accounts, savings, mortgages, transactions] = await Promise.all([
        fetch(`/api/v1/accounts/${userId}`).then(r => r.json()),
        fetch(`/api/v1/savings/${userId}`).then(r => r.json()),
        fetch(`/api/v1/mortgages/${userId}`).then(r => r.json()),
        fetch(`/api/v1/transactions/${userId}`).then(r => r.json()),
      ]);

      // Generate scenarios using FinancialEngine scenario comparison
      const scenarioRequest = {
        baseScenario: {
          monthlyIncome: FinancialEngine.getCashFlow(transactions, [], { start: '2025-01-01', end: '2025-12-31' }).monthlyIncome,
          monthlyExpenses: FinancialEngine.getCashFlow(transactions, [], { start: '2025-01-01', end: '2025-12-31' }).monthlyExpenses,
          monthlySavings: 500,
          mortgagePayment: mortgages.reduce((s: number, m: any) => s + (m.monthly_payment || 0), 0),
          extraPayments: [],
        },
        adjustments: [
          { type: 'savings', value: 200, path: 'monthlySavings' },
          { type: 'expenses', value: -150, path: 'monthlyExpenses' },
          { type: 'mortgage', value: 100, path: 'extraPayments.0.amount' },
        ],
      };

      return [
        { id: 'current', name: 'Current Plan', description: 'Your current financial plan', adjustments: [], isActive: true },
        { id: 'extra_savings', name: 'Extra $200 Savings', description: 'Add $200 monthly to savings', adjustments: scenarioRequest.adjustments.slice(0, 1), isActive: false },
        { id: 'extra_mortgage', name: 'Extra Mortgage Payment', description: 'Add $100 to mortgage payment', adjustments: scenarioRequest.adjustments.slice(0, 2), isActive: false },
        { id: 'conservative', name: 'Conservative', description: 'Reduce expenses by 10%', adjustments: scenarioRequest.adjustments.slice(1, 2), isActive: false },
      ];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function createPlanningEvent(eventData: Partial<PlanningEvent>): PlanningEvent {
  const now = new Date();
  const event: PlanningEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: eventData.type || 'custom',
    date: eventData.date || now.toISOString().split('T')[0],
    title: eventData.title || 'Untitled Event',
    description: eventData.description || '',
    amount: eventData.amount || 0,
    icon: eventData.icon || '📅',
    category: eventData.category || 'other',
    status: eventData.status || 'upcoming',
    color: getCategoryColor(eventData.category || 'other'),
    linkedFeature: eventData.linkedFeature,
    linkedPage: eventData.linkedPage,
    data: eventData.data || {},
    isForecast: eventData.isForecast || false,
    forecastConfidence: eventData.forecastConfidence || 0.7,
    source: eventData.source || 'deterministic',
    parentEventId: eventData.parentEventId,
    dependentEventIds: eventData.dependentEventIds || [],
  };
  return event;
}

function getCategoryColor(category: PlanningEventCategory): string {
  const colorMap: Record<PlanningEventCategory, string> = {
    income: '#10b981',
    expense: '#ef4444',
    debt: '#f59e0b',
    savings: '#3b82f6',
    investment: '#8b5cf6',
    retirement: '#14b8a6',
    mortgage: '#ec4899',
    bill: '#6366f1',
    goal: '#84cc16',
    milestone: '#fbbf24',
    forecast: '#6b7280',
    recommendation: '#ef4444',
    health: '#10b981',
    other: '#6b7280',
  };
  return colorMap[category] || colorMap.other;
}

export function usePlanningSettings() {
  const [settings, setSettings] = useState<PlanningSettings>({
    preferredRetirementAge: 65,
    forecastHorizon: 10,
    expectedInvestmentReturn: 0.07,
    inflationRate: 0.03,
    debtStrategy: 'snowball',
    timelineDefaultView: 'monthly',
    timelineVisibleFilters: ['income', 'expense', 'debt', 'savings', 'investment', 'retirement', 'mortgage', 'bill', 'goal'],
    enableLifeEvents: true,
  });

  const updateSettings = useCallback((updates: Partial<PlanningSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return { settings, updateSettings };
}

// Initialize with required state
function useState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  return [state, setState] as const;
}
