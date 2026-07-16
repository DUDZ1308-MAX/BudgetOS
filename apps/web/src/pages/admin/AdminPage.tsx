import { useWaitlistStore } from '@/stores/waitlist';
import { useFeedbackStore } from '@/stores/feedback';
import type { FeedbackEntry } from '@/stores/feedback';
import { useFeatureFlagsStore } from '@/stores/featureFlags';
import { useAdminStore } from '@/stores/admin';
import { useAuditStore } from '@/core/audit';
import { IconUsers, IconFlag, IconFeatureFlag, IconPrivacy, IconTerms } from '@/components/ui/Icons';

function IconBug(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M4 10h16" /><path d="M4 14h16" /><path d="M12 6v12" />
      <path d="M8 18l-2 3" /><path d="M16 18l2 3" />
    </svg>
  );
}

function IconActivity(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function AdminPage() {
  const { entries: waitlistEntries, approveEntry } = useWaitlistStore();
  const { entries: feedbackEntries } = useFeedbackStore();
  const { flags, overrides, setOverride, resetOverrides } = useFeatureFlagsStore();
  const { users, healthMetrics, isAdminUser } = useAdminStore();
  const auditEntries = useAuditStore((s) => s.entries);

  const pendingWaitlist = waitlistEntries.filter((e) => e.status === 'pending');
  const pendingFeedback = feedbackEntries.filter((e) => e.status === 'new');

  const unhealthyMetrics = healthMetrics.filter((m) => m.status !== 'healthy').length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconFlag className="h-6 w-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage waitlist, feature flags, feedback, and system health.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            isAdminUser
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isAdminUser ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isAdminUser ? 'Admin' : 'Read Only'}
          </span>
          <a
            href="/admin/beta-readiness"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Beta Readiness
          </a>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <IconUsers className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingWaitlist.length}</p>
              <p className="text-xs text-slate-500">Pending Approvals</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <IconBug className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingFeedback.length}</p>
              <p className="text-xs text-slate-500">New Feedback</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <IconFlag className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{flags.length}</p>
              <p className="text-xs text-slate-500">Feature Flags</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              unhealthyMetrics === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <IconActivity className={`h-5 w-5 ${unhealthyMetrics === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{unhealthyMetrics}</p>
              <p className="text-xs text-slate-500">Warnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">System Health</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {healthMetrics.map((metric) => (
              <div key={metric.name} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">{metric.name}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    metric.status === 'healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                    metric.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${
                      metric.status === 'healthy' ? 'bg-emerald-500' :
                      metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {metric.value}
                  <span className="text-xs font-normal text-slate-400 ml-1">{metric.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waitlist Management */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Waitlist Management ({waitlistEntries.length} total)</h2>
        </div>
        <div className="p-6">
          {waitlistEntries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No waitlist entries yet.</p>
          ) : (
            <div className="space-y-2">
              {waitlistEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-slate-500">{entry.email}</p>
                    <p className="text-xs text-slate-400">Joined: {new Date(entry.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      entry.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                      entry.status === 'invited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {entry.status}
                    </span>
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => approveEntry(entry.id)}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {entry.inviteCode && (
                      <code className="rounded bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {entry.inviteCode}
                      </code>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Feature Flags</h2>
          <button
            onClick={resetOverrides}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Reset All
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {(['experimental', 'beta', 'premium-preview', 'ab-test'] as const).map((group) => {
              const groupFlags = flags.filter((f) => f.group === group);
              if (groupFlags.length === 0) return null;
              return (
                <div key={group}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 capitalize">{group.replace('-', ' ')}</h4>
                  <div className="space-y-2">
                    {groupFlags.map((flag) => {
                      const enabled = overrides.find((o) => o.flagKey === flag.key)?.enabled ?? flag.defaultEnabled;
                      return (
                        <div key={flag.key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{flag.label}</p>
                            <p className="text-xs text-slate-500">{flag.description}</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => setOverride(flag.key, !enabled)}
                              className="peer sr-only"
                            />
                            <div className="h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-full dark:bg-slate-600" />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Audit Log ({auditEntries.length} entries)</h2>
        </div>
        <div className="p-6">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No audit entries yet. Activities will appear here as you use the app.</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {auditEntries.slice(0, 50).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {entry.action}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{entry.description}</span>
                  <span className="ml-auto shrink-0 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Review */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Feedback Review ({feedbackEntries.length} total)</h2>
        </div>
        <div className="p-6">
          {feedbackEntries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No feedback entries yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbackEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 capitalize">
                          {entry.type}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          entry.status === 'new' ? 'bg-amber-100 text-amber-700' :
                          entry.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{entry.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-400">
                        <span>v{entry.metadata.appVersion}</span>
                        <span>{entry.metadata.browser.split('/')[0]}</span>
                        <span>{entry.metadata.os}</span>
                        <span>{entry.metadata.route}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
