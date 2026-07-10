import { useState } from 'react';
import { useWaitlistStore } from '@/stores/waitlist';
import { IconUsers, IconSparkles, IconCheckCircle } from '@/components/ui/Icons';

export function WaitlistPage() {
  const { join, entries } = useWaitlistStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    const result = await join(email, name);
    setMessage(result.message);
    setStatus(result.success ? 'success' : 'error');
  };

  const handleRedeem = () => {
    const entry = entries.find((e) => e.inviteCode === inviteCode);
    setInviteStatus(entry && (entry.status === 'invited' || entry.status === 'approved') ? 'valid' : 'invalid');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          <IconSparkles className="h-3.5 w-3.5" />
          Public Beta
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Join the BudgetOS Waitlist</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Be first to experience the future of personal finance.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Join Waitlist */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Join the Waitlist</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get early access and exclusive updates.</p>
          {status === 'success' ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
              <IconCheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="wl-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  id="wl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="wl-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  id="wl-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              {status === 'error' && (
                <p className="text-xs text-red-500">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {status === 'submitting' ? 'Joining...' : 'Join the Waitlist'}
              </button>
            </form>
          )}
        </div>

        {/* Redeem Invite */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Have an Invite Code?</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your invite code to get started.</p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Invite Code</label>
              <input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteStatus('idle'); }}
                placeholder="XXXX-XXXX"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase tracking-widest focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            {inviteStatus === 'valid' && (
              <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Valid invite code! You can now create your account.</p>
              </div>
            )}
            {inviteStatus === 'invalid' && (
              <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Invalid or expired invite code.</p>
              </div>
            )}
            <button
              onClick={handleRedeem}
              disabled={!inviteCode}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Redeem Code
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <IconUsers className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Waitlist Status</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{entries.length}</p>
            <p className="text-xs text-slate-500">Total Signups</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{entries.filter((e) => e.status === 'approved').length}</p>
            <p className="text-xs text-slate-500">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{entries.filter((e) => e.status === 'pending').length}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
