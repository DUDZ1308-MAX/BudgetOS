import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { SuspenseWrapper } from '@/components/ui/SuspenseWrapper';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const CallbackPage = lazy(() => import('@/pages/auth/CallbackPage').then(m => ({ default: m.CallbackPage })));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const AddTransactionPage = lazy(() => import('@/features/transactions/AddTransactionPage').then(m => ({ default: m.AddTransactionPage })));
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage').then(m => ({ default: m.BudgetsPage })));
const AccountsPage = lazy(() => import('@/pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then(m => ({ default: m.AccountPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const DataManagementPage = lazy(() => import('@/pages/DataManagementPage').then(m => ({ default: m.DataManagementPage })));
const SavingsGoalsPage = lazy(() => import('@/pages/SavingsGoalsPage').then(m => ({ default: m.SavingsGoalsPage })));
const MortgagePage = lazy(() => import('@/pages/MortgagePage').then(m => ({ default: m.MortgagePage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const AiPage = lazy(() => import('@/pages/AiPage').then(m => ({ default: m.AiPage })));
const BillingPage = lazy(() => import('@/pages/BillingPage').then(m => ({ default: m.BillingPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const FinancialHealthPage = lazy(() => import('@/pages/FinancialHealth/FinancialHealthPage').then(m => ({ default: m.FinancialHealthPage })));
const NotificationsPage = lazy(() => import('@/pages/Notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// Phase 8.0 pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DemoPage = lazy(() => import('@/pages/demo/DemoPage').then(m => ({ default: m.DemoPage })));
const WaitlistPage = lazy(() => import('@/pages/WaitlistPage').then(m => ({ default: m.WaitlistPage })));
const StatusPage = lazy(() => import('@/pages/StatusPage').then(m => ({ default: m.StatusPage })));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const ReleaseNotesPage = lazy(() => import('@/pages/ReleaseNotesPage').then(m => ({ default: m.ReleaseNotesPage })));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));

// Phase 7.5 pages
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const BetaReadinessPage = lazy(() => import('@/pages/admin/BetaReadinessPage').then(m => ({ default: m.BetaReadinessPage })));

function Lazy({ children, name }: { children: React.ReactNode; name?: string }) {
  return <SuspenseWrapper name={name}>{children}</SuspenseWrapper>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Lazy name="landing"><LandingPage /></Lazy> },
      { path: 'demo', element: <Lazy name="demo"><DemoPage /></Lazy> },
      { path: 'waitlist', element: <Lazy name="waitlist"><WaitlistPage /></Lazy> },
      { path: 'status', element: <Lazy name="status"><StatusPage /></Lazy> },
      { path: 'help', element: <Lazy name="help center"><HelpCenterPage /></Lazy> },
      { path: 'release-notes', element: <Lazy name="release notes"><ReleaseNotesPage /></Lazy> },
      { path: 'privacy', element: <Lazy name="privacy"><PrivacyPage /></Lazy> },
      { path: 'terms', element: <Lazy name="terms"><TermsPage /></Lazy> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <Lazy name="login"><LoginPage /></Lazy> },
      { path: 'signup', element: <Lazy name="signup"><SignupPage /></Lazy> },
      { path: 'forgot-password', element: <Lazy name="forgot password"><ForgotPasswordPage /></Lazy> },
      { path: 'callback', element: <Lazy name="callback"><CallbackPage /></Lazy> },
      { path: 'update-password', element: <Lazy name="update password"><UpdatePasswordPage /></Lazy> },
    ],
  },
  {
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Lazy name="dashboard"><DashboardPage /></Lazy> },
      { path: '/transactions', element: <Lazy name="transactions"><TransactionsPage /></Lazy> },
      { path: '/transactions/add', element: <Lazy name="add transaction"><AddTransactionPage /></Lazy> },
      { path: '/budgets', element: <Lazy name="budgets"><BudgetsPage /></Lazy> },
      { path: '/accounts', element: <Lazy name="accounts"><AccountsPage /></Lazy> },
      { path: '/account', element: <Lazy name="account"><AccountPage /></Lazy> },
      { path: '/savings', element: <Lazy name="savings"><SavingsGoalsPage /></Lazy> },
      { path: '/mortgage', element: <Lazy name="mortgage"><MortgagePage /></Lazy> },
      { path: '/reports', element: <Lazy name="reports"><ReportsPage /></Lazy> },
      { path: '/settings', element: <Lazy name="settings"><SettingsPage /></Lazy> },
      { path: '/data', element: <Lazy name="data management"><DataManagementPage /></Lazy> },
      { path: '/health', element: <Lazy name="financial health"><FinancialHealthPage /></Lazy> },
      { path: '/notifications', element: <Lazy name="notifications"><NotificationsPage /></Lazy> },
      { path: '/ai', element: <Lazy name="AI"><AiPage /></Lazy> },
      { path: '/billing', element: <Lazy name="billing"><BillingPage /></Lazy> },
      { path: '/pricing', element: <Lazy name="pricing"><PricingPage /></Lazy> },
      { path: '/admin/beta-readiness', element: <Lazy name="beta readiness"><BetaReadinessPage /></Lazy> },
    ],
  },
]);
