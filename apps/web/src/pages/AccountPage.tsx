import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';

export function AccountPage() {
  const { user } = useAuthStore();
  const { profile, updateProfile, isLoading } = useProfileStore();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateProfile(user.id, { full_name: fullName || null } as any);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Profile</h2>

        {isLoading ? (
          <div className="h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <p className="mt-1 text-sm text-slate-900 dark:text-white">{user?.email}</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Display Name
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="displayName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Currency</label>
                <p className="mt-1 text-sm text-slate-900 dark:text-white">{profile?.currency ?? 'USD'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Timezone</label>
                <p className="mt-1 text-sm text-slate-900 dark:text-white">{profile?.timezone ?? 'UTC'}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Member Since</label>
              <p className="mt-1 text-sm text-slate-900 dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
