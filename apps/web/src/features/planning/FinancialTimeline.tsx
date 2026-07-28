"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { PlanningEvent, PlanningEventCategory, PlanningSettings, TimelineViewType } from './planningTypes';

interface FinancialTimelineProps {
  userId: string;
  className?: string;
}

export function FinancialTimeline({ userId, className = '' }: FinancialTimelineProps) {
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

  const [currentView, setCurrentView] = useState<TimelineViewType>('monthly');
  const [visibleCategories, setVisibleCategories] = useState<PlanningEventCategory[]>(settings.timelineVisibleFilters);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);

  const viewOptions: { key: TimelineViewType; label: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'yearly', label: 'Yearly' },
    { key: '5year', label: '5-Year' },
    { key: 'lifetime', label: 'Lifetime' },
  ];

  const categoryOptions: { key: PlanningEventCategory; label: string; color: string }[] = [
    { key: 'income', label: 'Income', color: '#10b981' },
    { key: 'expense', label: 'Expenses', color: '#ef4444' },
    { key: 'debt', label: 'Debt', color: '#f59e0b' },
    { key: 'savings', label: 'Savings', color: '#3b82f6' },
    { key: 'investment', label: 'Investments', color: '#8b5cf6' },
    { key: 'retirement', label: 'Retirement', color: '#14b8a6' },
    { key: 'mortgage', label: 'Mortgage', color: '#ec4899' },
    { key: 'bill', label: 'Bills', color: '#6366f1' },
    { key: 'goal', label: 'Goals', color: '#84cc16' },
  ];

  const timelineData = useMemo<PlanningEvent[]>(() => {
    const now = new Date();
    const events: PlanningEvent[] = [
      {
        id: 'payday-1',
        type: 'payday',
        date: now.toISOString().slice(0, 10),
        title: 'Monthly Payday',
        description: 'Regular paycheck deposit',
        amount: 5000,
        icon: '💰',
        category: 'income',
        status: 'completed',
        color: '#10b981',
        source: 'deterministic',
        isForecast: false,
      },
      {
        id: 'mortgage-1',
        type: 'mortgage',
        date: now.toISOString().slice(0, 10),
        title: 'Mortgage Payment',
        description: 'Monthly mortgage payment',
        amount: 1800,
        icon: '🏠',
        category: 'debt',
        status: 'upcoming',
        color: '#ec4899',
        source: 'deterministic',
        isForecast: false,
      },
      {
        id: 'savings-milestone',
        type: 'savings_milestone',
        date: new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString().slice(0, 10),
        title: 'Emergency Fund Milestone',
        description: 'Projected 50% emergency fund completion',
        amount: 5000,
        icon: '🎯',
        category: 'savings',
        status: 'upcoming',
        color: '#3b82f6',
        source: 'deterministic',
        isForecast: true,
        forecastConfidence: 0.85,
      },
      {
        id: 'retirement-target',
        type: 'retirement_target',
        date: new Date(now.getFullYear() + 20, 0, 1).toISOString().slice(0, 10),
        title: 'Retirement Target',
        description: 'Projected retirement readiness at age 65',
        amount: 1000000,
        icon: '☀️',
        category: 'retirement',
        status: 'upcoming',
        color: '#14b8a6',
        source: 'deterministic',
        isForecast: true,
        forecastConfidence: 0.80,
      },
      {
        id: 'debt-free',
        type: 'debt_payoff',
        date: new Date(now.getFullYear() + 5, 0, 1).toISOString().slice(0, 10),
        title: 'Debt Freedom',
        description: 'All debts projected to be paid off',
        amount: 0,
        icon: '🏆',
        category: 'debt',
        status: 'upcoming',
        color: '#f59e0b',
        source: 'deterministic',
        isForecast: true,
        forecastConfidence: 0.75,
      },
    ];
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const filteredEvents = useMemo(() => {
    return timelineData.filter((event) => visibleCategories.includes(event.category));
  }, [timelineData, visibleCategories]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Timeline</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your complete financial roadmap</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {viewOptions.map((opt) => (
              <button key={opt.key} onClick={() => setCurrentView(opt.key)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === opt.key ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <button key={opt.key} onClick={() => { setVisibleCategories((prev) => (prev.includes(opt.key) ? prev.filter((c) => c !== opt.key) : [...prev, opt.key])); }} className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${visibleCategories.includes(opt.key) ? 'text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`} style={visibleCategories.includes(opt.key) ? { backgroundColor: opt.color } : undefined}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative p-6">
        <div className="relative">
          <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none"><div className="h-full border-l-2 border-slate-200 dark:border-slate-700 ml-16" /></div>
          <div className="space-y-4 relative">
            {filteredEvents.map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="relative flex items-start group" onClick={() => setSelectedEvent(event)}>
                <div className="absolute left-8 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: event.color }} />
                <motion.div className="ml-6 flex-1 min-w-0 cursor-pointer" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{event.icon}</span>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                          {event.isForecast && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">Forecast</span>}
                          {event.status === 'completed' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded-full text-xs font-medium">Completed</span>}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                          <span>{event.date}</span>
                          {event.amount ? <span className={event.amount > 0 ? 'text-emerald-600' : 'text-red-600'}>{event.amount > 0 ? '+' : ''}${event.amount.toLocaleString()}</span> : null}
                          <span className="capitalize">{event.category}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="fixed right-4 top-20 w-[calc(100vw-2rem)] max-w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-slate-600 dark:text-slate-400"><strong>Date:</strong> {selectedEvent.date}</div>
              <div className="text-slate-600 dark:text-slate-400"><strong>Amount:</strong> {selectedEvent.amount ? `$${selectedEvent.amount.toLocaleString()}` : 'N/A'}</div>
              <div className="text-slate-600 dark:text-slate-400"><strong>Category:</strong> {selectedEvent.category}</div>
              <div className="text-slate-600 dark:text-slate-400"><strong>Status:</strong> {selectedEvent.status}</div>
              {selectedEvent.forecastConfidence && <div className="text-slate-600 dark:text-slate-400"><strong>Confidence:</strong> {(selectedEvent.forecastConfidence * 100).toFixed(0)}%</div>}
              {selectedEvent.source && <div className="text-slate-600 dark:text-slate-400"><strong>Source:</strong> {selectedEvent.source}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}