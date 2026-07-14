import { Link } from 'react-router-dom';
import { IconPrivacy } from '@/components/ui/Icons';

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="flex items-center gap-3">
        <IconPrivacy className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: July 9, 2026</p>
        </div>
      </div>

      <section className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Information We Collect</h2>
        <p>When you create an account, we collect your email address and encrypted password. You may optionally provide a display name. We store your financial data (transactions, budgets, accounts, savings goals) locally and in our cloud database via Supabase to enable cross-device sync.</p>
        <p>We collect anonymous usage data including page views, feature interactions, and error reports to improve the application. No personally identifiable financial information is included in usage data.</p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. How We Use Your Data</h2>
        <p>Your financial data is used solely to provide the MyBudgetOS service: generating reports, powering AI insights, calculating financial health scores, and enabling data export. We never sell your data to third parties.</p>
        <p>AI Copilot queries are processed through OpenAI's API. Queries are anonymized and do not include personally identifiable information beyond what you type. OpenAI does not use your financial data for model training.</p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Data Storage & Security</h2>
        <p>Data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption via Supabase. We retain your data for the duration of your account. Deleting your account permanently removes all associated data within 30 days.</p>
        <p>You can export or delete your data at any time from the Data Management page. Local backups stored in your browser can be cleared manually.</p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Third-Party Services</h2>
        <p>MyBudgetOS uses the following third-party services: Supabase (database and authentication), OpenAI (AI Copilot), Stripe (payment processing), and Vercel (hosting). Each provider processes data in accordance with their own privacy policies and applicable data protection laws.</p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Your Rights</h2>
        <p>You have the right to access, correct, export, or delete your data at any time. You can manage your data from Settings &gt; Data Management. For assistance, contact us at privacy@budgetos.app.</p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Changes to This Policy</h2>
        <p>We may update this policy from time to time. Material changes will be announced via in-app notification and email. Continued use of MyBudgetOS after changes constitutes acceptance of the updated policy.</p>
      </section>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
        <Link to="/auth/signup" className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400">
          &larr; Back to Sign Up
        </Link>
      </div>
    </div>
  );
}
