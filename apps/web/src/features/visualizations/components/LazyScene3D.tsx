import { lazy, Suspense, type FC } from 'react';
import { SceneFallback } from './Scene3D';
import type { NetWorth3DData, CashFlow3DData, SpendingCategory3D, BudgetProgress3DData, FinancialHealth3DData } from '../visualizationTypes';

interface LazyWrapperProps {
  height?: number;
}

const LazyNetWorth = lazy(() => import('./NetWorth3D').then((m) => ({ default: m.NetWorth3D })));
const LazyCashFlow = lazy(() => import('./CashFlow3D').then((m) => ({ default: m.CashFlow3D })));
const LazySpending = lazy(() => import('./Spending3D').then((m) => ({ default: m.Spending3D })));
const LazyBudgetProgress = lazy(() => import('./BudgetProgress3D').then((m) => ({ default: m.BudgetProgress3D })));
const LazyFinancialHealth = lazy(() => import('./FinancialHealth3D').then((m) => ({ default: m.FinancialHealth3D })));

interface NetWorthProps extends LazyWrapperProps { data: NetWorth3DData }
interface CashFlowProps extends LazyWrapperProps { data: CashFlow3DData }
interface SpendingProps extends LazyWrapperProps { categories: SpendingCategory3D[] }
interface BudgetProgressProps extends LazyWrapperProps { data: BudgetProgress3DData[] }
interface FinancialHealthProps extends LazyWrapperProps { data: FinancialHealth3DData }

export const NetWorth3DLazy: FC<NetWorthProps> = ({ data, height }) => (
  <Suspense fallback={<SceneFallback height={height ?? 250} />}>
    <LazyNetWorth data={data} height={height} />
  </Suspense>
);

export const CashFlow3DLazy: FC<CashFlowProps> = ({ data, height }) => (
  <Suspense fallback={<SceneFallback height={height ?? 250} />}>
    <LazyCashFlow data={data} height={height} />
  </Suspense>
);

export const Spending3DLazy: FC<SpendingProps> = ({ categories, height }) => (
  <Suspense fallback={<SceneFallback height={height ?? 250} />}>
    <LazySpending categories={categories} height={height} />
  </Suspense>
);

export const BudgetProgress3DLazy: FC<BudgetProgressProps> = ({ data, height }) => (
  <Suspense fallback={<SceneFallback height={height ?? 250} />}>
    <LazyBudgetProgress data={data} height={height} />
  </Suspense>
);

export const FinancialHealth3DLazy: FC<FinancialHealthProps> = ({ data, height }) => (
  <Suspense fallback={<SceneFallback height={height ?? 300} />}>
    <LazyFinancialHealth data={data} height={height} />
  </Suspense>
);
