import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { useThemeStore, THEMES } from '@/stores/theme';
import { useSyncStore } from '@/stores/sync';
import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { useAiSettingsStore } from '@/stores/aiSettings';
import { supabase } from '@/lib/supabase';
import { FeatureGate } from '@/billing/billingGuard';
import { getPlan } from '@/billing/pricingPlans';
import type { SubscriptionTier } from '@/billing/pricingPlans';
import { InlineValidation } from '@/components/ui/InlineValidation';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';

type SettingsTab = 'account' | 'billing' | 'ai' | 'notifications' | 'data' | 'appearance' | 'privacy' | 'feedback' | 'about';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing' },
  { id: 'ai', label: 'AI Copilot' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'data', label: 'Data' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'about', label: 'About' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Settings sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'account' && <AccountSection />}
        {activeTab === 'billing' && <BillingSection />}
        {activeTab === 'ai' && <AiSection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'data' && <DataSection />}
        {activeTab === 'appearance' && <AppearanceSection />}
        {activeTab === 'privacy' && <PrivacySection />}
        {activeTab === 'feedback' && <FeedbackSection />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  );
}

function AccountSection() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    await updateProfile(user.id, { full_name: fullName || null } as any);
    setProfileSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
            <p className="text-sm text-slate-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-slate-500 dark:text-slate-400">Full Name</label>
            <div className="mt-1 flex gap-2">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Your name"
              />
              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              aria-label="Confirm new password"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <InlineValidation error={passwordError} touched={true} />
          {passwordSuccess && <p className="text-sm text-emerald-500" role="status">Password updated successfully.</p>}
          <button
            type="submit"
            disabled={passwordLoading || !newPassword}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h2 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">Sign Out</h2>
        <p className="mb-3 text-xs text-red-500 dark:text-red-400">You will need to sign in again to access your data.</p>
        <button
          onClick={handleSignOut}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}

function BillingSection() {
  const navigate = useNavigate();
  const { tier, status, currentPeriodEnd } = useSubscriptionStore();
  const usageStore = useUsageStore();
  const plan = getPlan(tier);

  const aiUsage = usageStore.getAiUsage();
  const aiLimit = usageStore.getAiLimit(tier);
  const exportAllowed = usageStore.isExportAllowed(tier);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Current Plan</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Plan</span>
            <span className="font-medium text-slate-900 dark:text-white capitalize">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Status</span>
            <span className={`font-medium capitalize ${
              status === 'active' || status === 'trialing' ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              {status === 'trialing' ? 'Trial' : status}
            </span>
          </div>
          {currentPeriodEnd && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Current Period Ends</span>
              <span className="text-slate-900 dark:text-white">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Usage</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">AI Requests</span>
            <span className="text-slate-900 dark:text-white">{aiUsage} / {aiLimit === Infinity ? '∞' : aiLimit}</span>
          </div>
          <FeatureGate feature="export_data">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Exports</span>
              <span className="text-slate-900 dark:text-white">{exportAllowed ? 'Available' : 'Not available on your plan'}</span>
            </div>
          </FeatureGate>
        </div>
      </section>

      {tier !== 'premium' && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upgrade Your Plan</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unlock premium features including unlimited exports, advanced reports, and more.</p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function AiSection() {
  const navigate = useNavigate();
  const { provider, connectionStatus, providerSetups } = useAiSettingsStore();
  const usageStore = useUsageStore();
  const { tier } = useSubscriptionStore();

  const aiUsage = usageStore.getAiUsage();
  const aiLimit = usageStore.getAiLimit(tier);
  const setup = providerSetups[provider];
  const status = connectionStatus[provider] ?? 'unknown';

  const statusColor = status === 'connected' ? 'text-emerald-500'
    : status === 'failed' ? 'text-red-500'
    : 'text-slate-400';

  const statusLabel = status === 'connected' ? 'Connected'
    : status === 'failed' ? 'Connection Failed'
    : 'Unknown';

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">AI Provider</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Provider</span>
            <span className="font-medium text-slate-900 dark:text-white capitalize">{provider}</span>
          </div>
          {setup && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Model</span>
              <span className="text-slate-900 dark:text-white">{setup.model}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Connection</span>
            <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Usage</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Requests this month</span>
          <span className="text-slate-900 dark:text-white">{aiUsage} / {aiLimit === Infinity ? '∞' : aiLimit}</span>
        </div>
      </section>

      <button
        onClick={() => navigate('/ai')}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-purple-700"
      >
        Open AI Copilot Settings
      </button>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('budgetos_notification_prefs');
      return saved ? JSON.parse(saved) : { budgetAlerts: true, savingsMilestones: true, weeklySummary: true };
    } catch {
      return { budgetAlerts: true, savingsMilestones: true, weeklySummary: true };
    }
  });

  const savePrefs = (updated: typeof prefs) => {
    setPrefs(updated);
    try {
      localStorage.setItem('budgetos_notification_prefs', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const ToggleRow = ({ label, description, checked, onChange, disabled }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <ToggleRow
            label="Budget Alerts"
            description="Get notified when you exceed budget limits"
            checked={prefs.budgetAlerts}
            onChange={(v) => savePrefs({ ...prefs, budgetAlerts: v })}
          />
          <ToggleRow
            label="Savings Milestones"
            description="Celebrate when you reach savings goals"
            checked={prefs.savingsMilestones}
            onChange={(v) => savePrefs({ ...prefs, savingsMilestones: v })}
          />
          <FeatureGate feature="cloud_sync" fallback={
            <ToggleRow
              label="Weekly Summary"
              description="Receive a weekly spending and savings summary"
              checked={false}
              onChange={() => {}}
              disabled
            />
          }>
            <ToggleRow
              label="Weekly Summary"
              description="Receive a weekly spending and savings summary"
              checked={prefs.weeklySummary}
              onChange={(v) => savePrefs({ ...prefs, weeklySummary: v })}
            />
          </FeatureGate>
        </div>
      </section>
    </div>
  );
}

function DataSection() {
  const navigate = useNavigate();
  const { status, lastSyncTime, pendingCount } = useSyncStore();

  const syncStatusColor = status === 'online' ? 'text-emerald-500'
    : status === 'syncing' ? 'text-amber-500'
    : status === 'error' ? 'text-red-500'
    : 'text-slate-400';

  const syncStatusLabel = status === 'online' ? 'Connected'
    : status === 'syncing' ? 'Syncing...'
    : status === 'offline' ? 'Offline'
    : status === 'error' ? 'Sync Error'
    : 'Idle';

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Sync Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Status</span>
            <span className={`font-medium ${syncStatusColor}`}>{syncStatusLabel}</span>
          </div>
          {lastSyncTime && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Last Sync</span>
              <span className="text-slate-900 dark:text-white">{new Date(lastSyncTime).toLocaleString()}</span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Pending Changes</span>
              <span className="text-amber-500 font-medium">{pendingCount}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Import & Export</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Import, export, and backup your financial data.</p>
        <div className="flex flex-wrap gap-2">
          <FeatureGate feature="export_data">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Export Data
            </button>
          </FeatureGate>
          <button
            onClick={() => navigate('/data')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Open Data Management
          </button>
        </div>
      </section>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Theme</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Choose a theme that matches your style. {user ? 'Your preference is synced across devices.' : 'Sign in to sync your theme across devices.'}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                theme === t.id
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
              aria-label={`Select ${t.name} theme`}
              aria-pressed={theme === t.id}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-inner"
                  style={{ backgroundColor: t.preview.bg }}
                >
                  <div
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: t.preview.accent }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                    {theme === t.id && (
                      <svg className="h-4 w-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.bg }} />
                <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.surface }} />
                <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.accent }} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PrivacySection() {
  const [dataCollection, setDataCollection] = useState(() => {
    try {
      return localStorage.getItem('budgetos_data_collection') !== 'false';
    } catch {
      return true;
    }
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleDataCollection = () => {
    const next = !dataCollection;
    setDataCollection(next);
    try {
      localStorage.setItem('budgetos_data_collection', String(next));
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
        setDeleteError(error.message);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account. Please contact support.');
    }
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      message: 'Your data export is being prepared. In a full implementation, this would generate a downloadable archive of your data.',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mybudgetos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Data Collection</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Help us improve MyBudgetOS with anonymous usage data</p>
            </div>
            <button
              role="switch"
              aria-checked={dataCollection}
              aria-label="Data Collection"
              onClick={toggleDataCollection}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dataCollection ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dataCollection ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Export My Data</p>
            <button
              onClick={handleExportData}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Export Data
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h2 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">Delete Account</h2>
        <p className="mb-3 text-xs text-red-500 dark:text-red-400">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!deleteConfirmOpen ? (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              Type <span className="font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              aria-label="Type DELETE to confirm account deletion"
              className="block w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {deleteError && <p className="text-sm text-red-500" role="alert">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); setDeleteError(null); }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">MyBudgetOS</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Version</span>
            <span className="text-slate-900 dark:text-white">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Build</span>
            <span className="text-slate-900 dark:text-white">2024.12.01</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Links</h2>
        <div className="space-y-2">
          <a
            href="https://github.com/DUDZ1308-MAX/BudgetOS"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-brand-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
          >
            Documentation
          </a>
          <a
            href="https://github.com/DUDZ1308-MAX/BudgetOS"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-brand-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
          >
            GitHub
          </a>
          <a
            href="https://github.com/DUDZ1308-MAX/BudgetOS/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-brand-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
          >
            Support
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Third-Party Licenses</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This software uses open-source components. Licensed under the MIT License. See the LICENSE file for details. Notable dependencies include React, Tailwind CSS, Supabase, Zustand, Recharts, and more.
        </p>
      </section>
    </div>
  );
}

function FeedbackSection() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Send Feedback</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Help us improve MyBudgetOS by reporting bugs, suggesting features, or sharing general feedback.
        </p>
        <FeedbackForm />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Your Submissions</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          View and manage your previously submitted feedback.
        </p>
        <FeedbackList />
      </section>
    </div>
  );
}
