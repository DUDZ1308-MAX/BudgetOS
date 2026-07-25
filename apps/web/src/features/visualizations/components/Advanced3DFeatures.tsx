"use client";

import { Suspense, lazy, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useThemeColors } from './Scene3D';
import { FloatingMetric, SphericalProgress } from './Advanced3DComponents';
import type { NetWorth3DData, CashFlow3DData, SpendingCategory3D, BudgetProgress3DData, FinancialHealth3DData } from '../visualizationTypes';

const FinancialHealth3DLazy = lazy(() => import('./FinancialHealth3D').then(m => ({ default: m.FinancialHealth3D })));
const NetWorth3DLazy = lazy(() => import('./NetWorth3D').then(m => ({ default: m.NetWorth3D })));
const CashFlow3DLazy = lazy(() => import('./CashFlow3D').then(m => ({ default: m.CashFlow3D })));
const Spending3DLazy = lazy(() => import('./Spending3D').then(m => ({ default: m.Spending3D })));
const BudgetProgress3DLazy = lazy(() => import('./BudgetProgress3D').then(m => ({ default: m.BudgetProgress3D })));

interface Advanced3DFeaturesProps {
  netWorth: NetWorth3DData;
  cashFlow: CashFlow3DData;
  spending: SpendingCategory3D[];
  budgetProgress: BudgetProgress3DData[];
  healthScore: FinancialHealth3DData;
  className?: string;
}

export function Advanced3DFeatures({ netWorth, cashFlow, spending, budgetProgress, healthScore, className = '' }: Advanced3DFeaturesProps) {
  const colors = useThemeColors();

  // Calculate compound metrics for advanced display
  const compoundMetrics = useMemo(() => {
    const savingsRate = cashFlow.savings / Math.max(cashFlow.income, 1);
    const expenseRatio = cashFlow.expenses / Math.max(cashFlow.income, 1);
    const liquidityRatio = cashFlow.income / Math.max(Math.abs(cashFlow.remaining), cashFlow.income * 0.1);
    const netWorthGrowth = netWorth.netWorth > 0 ? netWorth.netWorth / Math.max(Math.abs(netWorth.liabilities), 1) : 0;
    
    return {
      savingsRate,
      expenseRatio,
      liquidityRatio,
      netWorthGrowth,
      healthScore: healthScore.score / healthScore.maxScore,
    };
  }, [netWorth, cashFlow, healthScore]);

  // Floating animated circles for financial metrics
  const FloatingMetrics = useMemo(() => {
    const metrics = [
      { value: compoundMetrics.savingsRate, label: 'Savings Rate', color: colors.success, icon: '💰', maxValue: 0.5 },
      { value: compoundMetrics.netWorthGrowth, label: 'Net Worth Growth', color: colors.accent, icon: '📈', maxValue: 2 },
      { value: compoundMetrics.healthScore, label: 'Health Score', color: colors.warning, icon: '⭐', maxValue: 1 },
      { value: 1 / (1 + compoundMetrics.expenseRatio), label: 'Expense Ratio (inv)', color: colors.error, icon: '💸', maxValue: 1 },
      { value: compoundMetrics.liquidityRatio, label: 'Liquidity Ratio', color: colors.success, icon: '💵', maxValue: 5 },
    ];

    return metrics.map((metric, i) => ({
      ...metric,
      position: {
        x: Math.cos((i * Math.PI * 2) / metrics.length) * 3.5,
        z: Math.sin((i * Math.PI * 2) / metrics.length) * 3.5,
        y: Math.random() * 1 - 0.5,
      },
    }));
  }, [compoundMetrics]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Background Environment */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        dpr={0.8}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Environment preset="city" />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
{/* Floating financial metrics */}
           {FloatingMetrics.map((metric, i) => (
             <FloatingMetric
               key={metric.label}
               position={metric.position}
               value={metric.value}
               maxValue={metric.maxValue}
               label={metric.label}
               icon={metric.icon}
               color={metric.color}
               index={i}
             />
           ))}
          
          {/* Spherical progress rings */}
          <SphericalProgress
            position={{ x: 0, y: -1, z: 0 }}
            size={3}
            segments={3}
            colors={[colors.success, colors.warning, colors.accent]}
            data={compoundMetrics}
          />
        </Suspense>
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0,0-2,0l-7,4A2 2 0,0,0 3 8v8a2 2 0,0,0,1 1.73l7 4a2 2 0,0,0,2 0l7-4A2 2 0,0,1 21 16z"/>
          </svg>
          Advanced 3D Analytics
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Savings Rate"
            value={compoundMetrics.savingsRate * 100}
            suffix="%"
            color={colors.success}
            trend={compoundMetrics.netWorthGrowth > 0 ? "up" : "down"}
          />
          <MetricCard
            label="Net Worth Growth"
            value={compoundMetrics.netWorthGrowth * 100}
            suffix="%"
            color={colors.accent}
            trend={compoundMetrics.healthScore > 0.7 ? "up" : "down"}
          />
          <MetricCard
            label="Health Score"
            value={compoundMetrics.healthScore * 100}
            suffix="/100"
            color={compoundMetrics.healthScore > 0.7 ? colors.success : colors.warning}
            trend={compoundMetrics.healthScore > 0.6 ? "up" : "down"}
          />
          <MetricCard
            label="Expense Ratio"
            value={compoundMetrics.expenseRatio * 100}
            suffix="%"
            color={compoundMetrics.expenseRatio < 0.8 ? colors.success : colors.error}
            trend={compoundMetrics.expenseRatio < 0.8 ? "up" : "down"}
          />
        </div>
      </div>

      {/* Floating 3D Components */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-4">
        {/* Net Worth 3D with floating */}
        <div className="w-64 h-64">
          <Suspense fallback={<div className="w-full h-full bg-slate-800 rounded-lg animate-pulse" />}>
            <NetWorth3DLazy data={netWorth} height={256} />
          </Suspense>
        </div>
        
        {/* Cash Flow 3D */}
        <div className="w-64 h-40">
          <Suspense fallback={<div className="w-full h-full bg-slate-800 rounded-lg animate-pulse" />}>
            <CashFlow3DLazy data={cashFlow} height={160} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  suffix: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

function MetricCard({ label, value, suffix, color, trend }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className={trendColor}>{trendIcon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-bold text-white">{value.toFixed(1)}</span>
        <span className="text-xs text-slate-500 mb-0.5">{suffix}</span>
      </div>
    </div>
  );
}

// export { Advanced3DFeatures }; // ✅ Export needs to match development
