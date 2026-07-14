export interface KBArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'budgets' | 'accounts' | 'savings' | 'reports' | 'ai-copilot' | 'troubleshooting' | 'faq';
  content: string;
}

export interface KBCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const kbCategories: KBCategory[] = [
  { id: 'getting-started', name: 'Getting Started', description: 'New to MyBudgetOS? Start here.', icon: 'rocket' },
  { id: 'budgets', name: 'Budgets', description: 'Learn how to create and manage budgets.', icon: 'chart' },
  { id: 'accounts', name: 'Accounts', description: 'Manage your financial accounts.', icon: 'accounts' },
  { id: 'savings', name: 'Savings Goals', description: 'Set and track savings targets.', icon: 'target' },
  { id: 'reports', name: 'Reports & Analytics', description: 'Understand your financial data.', icon: 'reports' },
  { id: 'ai-copilot', name: 'AI Copilot', description: 'Get the most out of your AI assistant.', icon: 'sparkles' },
  { id: 'troubleshooting', name: 'Troubleshooting', description: 'Resolve common issues.', icon: 'help' },
  { id: 'faq', name: 'FAQ', description: 'Frequently asked questions.', icon: 'help' },
];

export const knowledgeBase: KBArticle[] = [
  {
    id: 'gs-1',
    title: 'Creating Your First Budget',
    description: 'Learn how to set up your first budget in MyBudgetOS.',
    category: 'getting-started',
    content: `Getting started with your first budget is easy. Navigate to the Budgets page from the sidebar and click "Create Budget". Choose a category, set a spending limit, and select the timeframe (weekly, monthly, or yearly). MyBudgetOS will automatically track your spending against the budget and alert you when you're getting close to the limit. You can create as many budgets as you need across different categories.`,
  },
  {
    id: 'gs-2',
    title: 'Adding Your First Transaction',
    description: 'Record your income and expenses.',
    category: 'getting-started',
    content: `To add a transaction, go to the Transactions page and click "Add Transaction". Enter the amount, select the type (income or expense), choose a category, and pick the account. You can add a description and date for better tracking. MyBudgetOS will automatically update your account balances, budget spending, and dashboard metrics.`,
  },
  {
    id: 'gs-3',
    title: 'Setting Up Accounts',
    description: 'Connect your financial accounts.',
    category: 'getting-started',
    content: `Navigate to Accounts in the sidebar to manage your financial accounts. You can add checking accounts, savings accounts, and credit cards. Each account tracks its own balance and transaction history. Your net worth is automatically calculated across all accounts.`,
  },
  {
    id: 'bd-1',
    title: 'Understanding Budget Categories',
    description: 'How categories work with budgets.',
    category: 'budgets',
    content: `Categories in MyBudgetOS help you organize your spending. Each transaction is assigned a category, and budgets are set per category. This lets you see exactly where your money is going. You can customize categories to match your spending habits. The system comes with common defaults like Housing, Groceries, Transportation, and Entertainment.`,
  },
  {
    id: 'bd-2',
    title: 'Budget Alerts and Notifications',
    description: 'Stay on track with automatic alerts.',
    category: 'budgets',
    content: `MyBudgetOS sends alerts when you're approaching or exceeding your budget limits. You'll get notified at 75%, 90%, and 100% of your budget. Alerts appear in the notification center and can be configured in Settings. You can also opt for weekly summary emails.`,
  },
  {
    id: 'ac-1',
    title: 'Managing Multiple Accounts',
    description: 'Keep all your accounts in one place.',
    category: 'accounts',
    content: `You can add as many accounts as you need. Each account maintains its own balance and transaction history. The dashboard shows a consolidated view of all accounts, and you can filter reports by specific accounts. Credit card accounts automatically track your outstanding balance.`,
  },
  {
    id: 'sv-1',
    title: 'Setting Savings Goals',
    description: 'Define and track your savings targets.',
    category: 'savings',
    content: `Savings goals help you plan for future expenses. Set a target amount and target date, and MyBudgetOS will calculate how much you need to save each month. You can track your progress with visual indicators and get notified when you reach milestones.`,
  },
  {
    id: 'rp-1',
    title: 'Generating Financial Reports',
    description: 'Understand your financial patterns.',
    category: 'reports',
    content: `Reports give you deep insights into your finances. You can generate spending by category, income vs expenses over time, net worth trends, and budget performance. Reports can be exported as PDF, CSV, or Excel for sharing or offline analysis.`,
  },
  {
    id: 'ai-1',
    title: 'Using the AI Financial Copilot',
    description: 'Get AI-powered financial advice.',
    category: 'ai-copilot',
    content: `The AI Financial Copilot is your personal financial assistant. Ask questions like "How much did I spend on dining out last month?" or "Am I on track for my savings goals?" The AI analyzes your financial data and provides personalized insights, recommendations, and answers. The AI Copilot is available on the AI page and can also provide proactive insights on your dashboard.`,
  },
  {
    id: 'ai-2',
    title: 'AI Copilot Tips and Best Practices',
    description: 'Get the most out of your AI assistant.',
    category: 'ai-copilot',
    content: `To get the best results from the AI Copilot, try asking specific questions about your finances. You can ask about spending patterns, budget recommendations, savings strategies, and financial health improvement. The AI works best with at least a month of transaction data. All AI requests are encrypted and your financial data is never used for training.`,
  },
  {
    id: 'tr-1',
    title: 'Troubleshooting Sync Issues',
    description: 'Resolve data synchronization problems.',
    category: 'troubleshooting',
    content: `If you're experiencing sync issues, first check your internet connection. MyBudgetOS will automatically queue changes when offline and sync when connectivity is restored. You can check sync status in the Data Management page. If problems persist, try signing out and signing back in, or contact support.`,
  },
  {
    id: 'tr-2',
    title: 'Data Backup and Restore',
    description: 'Keep your financial data safe.',
    category: 'troubleshooting',
    content: `MyBudgetOS automatically saves your data to the cloud. You can also create manual backups from the Data Management page. Backups can be downloaded as JSON files and restored at any time. We recommend creating a backup before making major changes.`,
  },
  {
    id: 'faq-1',
    title: 'Is my financial data secure?',
    description: 'Learn about our security practices.',
    category: 'faq',
    content: 'Yes. All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. We use Supabase for secure authentication and data storage. Your financial data is never shared with third parties, and AI requests are anonymized.',
  },
  {
    id: 'faq-2',
    title: 'Can I export my data?',
    description: 'Export options available.',
    category: 'faq',
    content: 'Yes. You can export your data as PDF, CSV, or Excel files from the Reports page. You can also download a complete JSON backup from the Data Management page.',
  },
  {
    id: 'faq-3',
    title: 'How does billing work?',
    description: 'Understanding our pricing and billing.',
    category: 'faq',
    content: 'MyBudgetOS offers Free, Pro ($9/mo), and Premium ($19/mo) plans. The Free plan includes 50 transactions, 2 accounts, and 5 AI requests per month. Upgrading unlocks unlimited features and higher AI usage limits. Visit the Pricing page for full details.',
  },
  {
    id: 'faq-4',
    title: 'What is the AI Copilot?',
    description: 'Understanding AI features.',
    category: 'faq',
    content: 'The AI Financial Copilot is an AI-powered assistant that helps you understand your finances. It can answer questions about your spending, provide budget recommendations, analyze trends, and offer personalized financial advice. It uses OpenAI\'s GPT models and your financial data to provide context-aware responses.',
  },
];
