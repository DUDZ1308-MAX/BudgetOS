import { Link, useNavigate } from 'react-router-dom';
import { IconSparkles, IconCrown, IconTarget, IconChart, IconStar, IconHelp } from '@/components/ui/Icons';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function IconCheck(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconShieldCheck(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconBookOpen(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function IconLaptop(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="2" y1="21" x2="22" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: IconChart,
    title: 'Smart Budgeting',
    description: 'Create budgets that actually work. Track spending by category, get alerts before you overspend, and see exactly where your money goes.',
  },
  {
    icon: IconSparkles,
    title: 'AI Financial Copilot',
    description: 'Your personal AI financial assistant. Ask questions, get insights, and receive personalized recommendations to improve your finances.',
  },
  {
    icon: IconTarget,
    title: 'Goal Tracking',
    description: 'Set savings goals and watch your progress. Whether it\'s an emergency fund, vacation, or big purchase — stay motivated with visual milestones.',
  },
  {
    icon: IconCrown,
    title: 'Multi-Account Support',
    description: 'Manage checking, savings, credit cards, and mortgage all in one place. See your complete financial picture at a glance.',
  },
  {
    icon: IconBookOpen,
    title: 'Reports & Analytics',
    description: 'Understand your financial patterns with beautiful reports. Export to PDF, CSV, or Excel for tax prep or financial planning.',
  },
  {
    icon: IconLaptop,
    title: 'Cross-Device Sync',
    description: 'Your data syncs automatically across all your devices. Start on your phone, finish on your laptop — your finances go where you go.',
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started.',
    features: ['50 transactions/month', '2 accounts', '5 AI requests/month', 'Basic reports', 'Dark mode'],
    cta: 'Get Started Free',
    href: '/auth/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For serious budgeters.',
    features: ['Unlimited transactions', 'Unlimited accounts', '200 AI requests/month', 'CSV/Excel import', 'PDF/CSV/Excel export', 'Cloud sync', 'Priority support'],
    cta: 'Start Pro Trial',
    href: '/auth/signup',
    featured: true,
  },
  {
    name: 'Premium',
    price: '$19',
    period: '/month',
    description: 'For financial power users.',
    features: ['1,000 AI requests/month', 'Priority AI responses', 'Advanced analytics', 'Early access features', 'Premium report templates', 'VIP support'],
    cta: 'Go Premium',
    href: '/auth/signup',
    featured: false,
  },
];

const FAQS = [
  { q: 'Is my financial data secure?', a: 'Absolutely. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use Supabase for authentication and storage. Your data is never shared or sold.' },
  { q: 'Can I try MyBudgetOS for free?', a: 'Yes! The Free plan includes 50 transactions, 2 accounts, and 5 AI requests per month. No credit card required.' },
  { q: 'How does the AI Copilot work?', a: 'The AI analyzes your financial data to provide personalized insights and recommendations. It can answer questions about your spending, suggest budgets, and help you reach your savings goals.' },
  { q: 'Can I export my data?', a: 'Yes. Export your data as PDF, CSV, or Excel from the Reports page. You can also download a complete JSON backup at any time.' },
  { q: 'Is there a mobile app?', a: 'MyBudgetOS is a progressive web app (PWA) that works on any device with a browser. You can install it to your home screen for a native-like experience.' },
  { q: 'How does cloud sync work?', a: 'Your data syncs automatically via Supabase when you\'re online. Changes queue locally when offline and sync when connectivity returns.' },
];

export function LandingPage() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
              <IconSparkles className="h-3.5 w-3.5" />
              Public Beta Now Live
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
              Take Control of Your
              <span className="block text-brand-600">Financial Future</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 md:text-xl">
              Smart budgeting, AI-powered insights, and beautiful visualizations — all in one place.
              Your finances, simplified.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/auth/signup"
                className="rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <button
                onClick={() => navigate('/demo')}
                className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Explore Demo
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">No credit card required. Free plan available.</p>
          </div>
        </div>
        <div className="absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />
        <div className="absolute -bottom-40 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5" />
      </section>

      {/* Trust Bar */}
      <section className="border-y border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">Trusted by early adopters — now in public beta</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Everything you need to manage your money</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">MyBudgetOS combines smart budgeting with AI-powered insights to give you complete financial clarity.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Copilot */}
      <section id="ai" className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                <IconSparkles className="h-3.5 w-3.5" />
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Your Personal AI Financial Copilot</h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                Get instant answers about your finances. Ask "How much did I spend on dining out?" or "Am I on track for retirement?"
                The AI analyzes your data and provides personalized recommendations.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Natural language financial queries',
                  'Personalized budget recommendations',
                  'Spending pattern analysis',
                  'Savings goal optimization',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <IconCheck className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">AI</div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Financial Copilot</p>
                  <p className="text-xs text-slate-400">Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">How much did I spend on dining out this month?</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-900/20">
                  <p className="text-sm text-slate-700 dark:text-slate-300">You've spent $380 on dining out this month, which is 95% of your $400 budget. At your current pace, you'll exceed your budget by about $20. Consider reducing to 2-3 restaurant visits per week.</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your AI Copilot..."
                  readOnly
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                />
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Get started in minutes. No setup headaches.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Create Your Account', description: 'Sign up for free. No credit card required.' },
              { step: '02', title: 'Add Your Accounts', description: 'Link your checking, savings, and credit cards. Or start simple with one account.' },
              { step: '03', title: 'Let AI Do the Rest', description: 'MyBudgetOS automatically tracks your spending, creates budgets, and provides AI-powered insights.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Start free. Upgrade when you need more.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 md:p-8 ${
                  plan.featured
                    ? 'border-brand-500 bg-white shadow-xl shadow-brand-500/10 dark:border-brand-600 dark:bg-slate-900 scale-105'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <IconCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`mt-8 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    plan.featured
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section id="security" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: IconShieldCheck, label: 'Encryption', desc: 'TLS 1.3 + AES-256' },
                  { icon: IconShield, label: 'Privacy', desc: 'Zero data sharing' },
                  { icon: IconBadgeCheck, label: 'Compliance', desc: 'SOC 2 compliant' },
                  { icon: IconHelp, label: 'Open Source', desc: 'Auditable code' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <item.icon className="h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Your Data Stays Yours</h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                Security is built into every layer of MyBudgetOS. Your financial data is encrypted, private, and never shared.
                We believe financial tools should be trustworthy by default.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'End-to-end encryption for all data',
                  'SOC 2 Type II compliant infrastructure',
                  'Open source — fully auditable codebase',
                  'Zero third-party data sharing',
                  'GDPR compliant data handling',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <IconCheck className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Loved by Early Users</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Here's what beta testers are saying about MyBudgetOS.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { quote: 'The AI Copilot is a game-changer. I asked it to find ways to save $200/month and it actually delivered.', name: 'Sarah M.', role: 'Freelance Designer' },
              { quote: 'Finally, a budgeting app that doesn\'t feel like a chore. The visual reports are gorgeous.', name: 'James K.', role: 'Software Engineer' },
              { quote: 'I\'ve tried every budgeting app out there. MyBudgetOS is the first one that actually works for me.', name: 'Emily R.', role: 'Marketing Manager' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <IconStar key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                  {faq.q}
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-purple-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to Take Control of Your Finances?</h2>
          <p className="mt-4 text-lg text-white/80">Join the public beta today. Free plan available — no credit card required.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/auth/signup"
              className="rounded-xl bg-white px-8 py-3 text-base font-semibold text-brand-700 hover:bg-slate-100 transition-colors"
            >
              Get Started Free
            </Link>
            <button
              onClick={() => navigate('/demo')}
              className="rounded-xl border border-white/30 px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <img src="/logo.png" alt="MyBudgetOS" className="h-6 w-6 rounded-md object-contain" />
                MyBudgetOS
              </div>
              <p className="mt-2 text-xs text-slate-500">Plan. Track. Grow.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</h4>
              <ul className="mt-4 space-y-2">
                {['Features', 'Pricing', 'AI Copilot', 'Demo'].map((item) => (
                  <li key={item}>
                    <button onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</h4>
              <ul className="mt-4 space-y-2">
                {['About', 'Blog', 'Privacy', 'Terms'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Support</h4>
              <ul className="mt-4 space-y-2">
                {['Help Center', 'Documentation', 'Contact', 'Status'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} MyBudgetOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function IconShield(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBadgeCheck(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}