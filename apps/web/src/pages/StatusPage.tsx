import { useState, useEffect } from 'react';
import { IconStatus, IconBadgeCheck } from '@/components/ui/Icons';

interface ServiceStatus {
  name: string;
  key: string;
  status: 'operational' | 'degraded' | 'down' | 'checking';
  latency?: string;
  description: string;
}

const SERVICES: ServiceStatus[] = [
  { name: 'Authentication', key: 'auth', status: 'operational', latency: '<100ms', description: 'User login, signup, and session management' },
  { name: 'Cloud Sync', key: 'sync', status: 'operational', latency: '<200ms', description: 'Data synchronization across devices' },
  { name: 'AI Copilot', key: 'ai', status: 'operational', latency: '<2s', description: 'AI-powered financial assistant' },
  { name: 'OpenAI', key: 'openai', status: 'operational', latency: '<3s', description: 'AI model inference and processing' },
  { name: 'Reports', key: 'reports', status: 'operational', latency: '<500ms', description: 'Report generation and export' },
  { name: 'Billing', key: 'billing', status: 'operational', latency: '<100ms', description: 'Payment processing and subscriptions' },
  { name: 'Notifications', key: 'notifications', status: 'operational', latency: '<100ms', description: 'Push and in-app notifications' },
];

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
  const styles = {
    operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    degraded: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    down: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    checking: 'bg-slate-100 text-slate-500 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'operational' ? 'bg-emerald-500' :
        status === 'degraded' ? 'bg-amber-500' :
        status === 'down' ? 'bg-red-500' : 'bg-slate-400'
      }`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);

  useEffect(() => {
    const timers = services
      .filter((s) => s.status === 'checking')
      .map((s) => {
        return setTimeout(() => {
          setServices((prev) =>
            prev.map((p) =>
              p.key === s.key ? { ...p, status: 'operational' as const } : p
            )
          );
        }, 1500);
      });
    return () => timers.forEach(clearTimeout);
  }, []);

  const operational = services.filter((s) => s.status === 'operational').length;
  const total = services.length;
  const isAllOperational = operational === total;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <IconStatus className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Status</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current operational status of MyBudgetOS services.</p>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`rounded-2xl border p-6 ${
        isAllOperational
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isAllOperational
              ? 'bg-emerald-100 dark:bg-emerald-900/40'
              : 'bg-amber-100 dark:bg-amber-900/40'
          }`}>
            <IconBadgeCheck className={`h-6 w-6 ${isAllOperational ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isAllOperational ? 'All Systems Operational' : 'Some Systems Experiencing Issues'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {operational} of {total} services operational
            </p>
          </div>
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.key}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{service.name}</h3>
                <StatusBadge status={service.status} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{service.description}</p>
            </div>
            {service.latency && (
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{service.latency}</span>
            )}
          </div>
        ))}
      </div>

      {/* Uptime */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">30-Day Uptime</h3>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-3 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-3 rounded-full bg-emerald-500" style={{ width: '99.9%' }} />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">99.9%</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Incidents</h3>
        <div className="text-center py-8 text-sm text-slate-400">
          <IconBadgeCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
          <p>No recent incidents reported.</p>
          <p className="text-xs text-slate-400 mt-1">MyBudgetOS has maintained 99.9% uptime during beta.</p>
        </div>
      </div>
    </div>
  );
}
