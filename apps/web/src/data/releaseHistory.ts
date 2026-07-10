export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'major' | 'minor' | 'patch' | 'beta';
  highlights: string[];
  fixes: string[];
  breaking?: string[];
}

export const releaseHistory: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: '2026-07-09',
    title: 'Public Beta Launch',
    description: 'BudgetOS is officially entering public beta. Welcome!',
    type: 'major',
    highlights: [
      'Smart Dashboard with real-time financial overview',
      'AI Financial Copilot powered by OpenAI',
      'Financial Health Score with actionable recommendations',
      'Automated budget tracking and alerts',
      'Savings goals with progress tracking',
      'Mortgage calculator and payoff planner',
      'Cloud sync across all your devices',
      'Data import from CSV, Excel, and JSON',
      'Custom reports and export (PDF, CSV, Excel)',
      'Dark mode support',
    ],
    fixes: [],
  },
  {
    version: '0.9.0',
    date: '2026-06-28',
    title: 'Beta Release Candidate',
    description: 'Pre-release testing build with all core features.',
    type: 'beta',
    highlights: [
      'Production hardening and performance optimization',
      'Accessibility improvements (WCAG compliance)',
      'Error handling and monitoring infrastructure',
      'Offline support with sync queue',
      'Backup and restore functionality',
    ],
    fixes: [
      'Fixed spending velocity calculation in insights',
      'Improved mobile navigation UX',
      'Fixed FocusTrap keyboard handling',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-06-15',
    title: 'Intelligence & Growth',
    description: 'Financial health scoring, alerts, and recommendation engine.',
    type: 'minor',
    highlights: [
      'Financial Health Engine with 7-factor scoring',
      'Proactive alerts for budgets, cash flow, and savings',
      'Personalized recommendations',
      'Trend analysis and spending patterns',
      'Notification center',
    ],
    fixes: [
      'Fixed category budget overspend detection',
      'Improved savings rate calculation accuracy',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-06-01',
    title: 'AI Financial Copilot',
    description: 'AI-powered financial assistance with natural language queries.',
    type: 'major',
    highlights: [
      'AI Financial Copilot chat interface',
      'Natural language budget analysis',
      'AI-powered insights and recommendations',
      'OpenAI integration with configurable provider',
    ],
    fixes: [],
  },
];
