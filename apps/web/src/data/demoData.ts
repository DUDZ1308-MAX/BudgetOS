export interface DemoAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
}

export interface DemoCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budgeted: number;
  spent: number;
}

export interface DemoTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
}

export interface DemoSavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
}

export interface DemoMortgage {
  principal: number;
  rate: number;
  term: number;
  payment: number;
  remaining: number;
}

export interface DemoData {
  accounts: DemoAccount[];
  categories: DemoCategory[];
  transactions: DemoTransaction[];
  savingsGoals: DemoSavingsGoal[];
  mortgage: DemoMortgage;
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
}

export const demoData: DemoData = {
  totalIncome: 8450,
  totalExpenses: 5230,
  netWorth: 45280,
  accounts: [
    { id: 'demo-acct-1', name: 'Main Checking', type: 'checking', balance: 4320 },
    { id: 'demo-acct-2', name: 'High-Yield Savings', type: 'savings', balance: 28500 },
    { id: 'demo-acct-3', name: 'Rewards Credit Card', type: 'credit', balance: -1240 },
    { id: 'demo-acct-4', name: 'Emergency Fund', type: 'savings', balance: 15000 },
  ],
  categories: [
    { id: 'demo-cat-1', name: 'Salary', type: 'income', budgeted: 7000, spent: 7000 },
    { id: 'demo-cat-2', name: 'Freelance', type: 'income', budgeted: 2000, spent: 1450 },
    { id: 'demo-cat-3', name: 'Housing', type: 'expense', budgeted: 1800, spent: 1800 },
    { id: 'demo-cat-4', name: 'Groceries', type: 'expense', budgeted: 600, spent: 520 },
    { id: 'demo-cat-5', name: 'Dining Out', type: 'expense', budgeted: 400, spent: 380 },
    { id: 'demo-cat-6', name: 'Transportation', type: 'expense', budgeted: 300, spent: 210 },
    { id: 'demo-cat-7', name: 'Utilities', type: 'expense', budgeted: 250, spent: 245 },
    { id: 'demo-cat-8', name: 'Entertainment', type: 'expense', budgeted: 200, spent: 175 },
    { id: 'demo-cat-9', name: 'Shopping', type: 'expense', budgeted: 300, spent: 480 },
    { id: 'demo-cat-10', name: 'Healthcare', type: 'expense', budgeted: 200, spent: 165 },
    { id: 'demo-cat-11', name: 'Subscriptions', type: 'expense', budgeted: 100, spent: 95 },
    { id: 'demo-cat-12', name: 'Insurance', type: 'expense', budgeted: 350, spent: 350 },
  ],
  transactions: [
    { id: 'demo-tx-1', date: '2026-07-01', description: 'Monthly Salary', amount: 7000, type: 'income', category: 'Salary', account: 'Main Checking' },
    { id: 'demo-tx-2', date: '2026-07-02', description: 'Rent Payment', amount: 1800, type: 'expense', category: 'Housing', account: 'Main Checking' },
    { id: 'demo-tx-3', date: '2026-07-03', description: 'Freelance Web Design', amount: 1200, type: 'income', category: 'Freelance', account: 'Main Checking' },
    { id: 'demo-tx-4', date: '2026-07-03', description: 'Whole Foods', amount: 85, type: 'expense', category: 'Groceries', account: 'Rewards Credit Card' },
    { id: 'demo-tx-5', date: '2026-07-04', description: 'Shell Gas Station', amount: 48, type: 'expense', category: 'Transportation', account: 'Rewards Credit Card' },
    { id: 'demo-tx-6', date: '2026-07-05', description: 'Netflix Subscription', amount: 16, type: 'expense', category: 'Subscriptions', account: 'Main Checking' },
    { id: 'demo-tx-7', date: '2026-07-06', description: 'Trader Joe\'s', amount: 62, type: 'expense', category: 'Groceries', account: 'Rewards Credit Card' },
    { id: 'demo-tx-8', date: '2026-07-07', description: 'Uber Rides', amount: 24, type: 'expense', category: 'Transportation', account: 'Rewards Credit Card' },
    { id: 'demo-tx-9', date: '2026-07-08', description: 'Freelance Consulting', amount: 250, type: 'income', category: 'Freelance', account: 'Main Checking' },
    { id: 'demo-tx-10', date: '2026-07-08', description: 'Electric Bill', amount: 95, type: 'expense', category: 'Utilities', account: 'Main Checking' },
    { id: 'demo-tx-11', date: '2026-07-09', description: 'Dinner at Italian Place', amount: 78, type: 'expense', category: 'Dining Out', account: 'Rewards Credit Card' },
    { id: 'demo-tx-12', date: '2026-07-10', description: 'Amazon Purchase', amount: 45, type: 'expense', category: 'Shopping', account: 'Rewards Credit Card' },
    { id: 'demo-tx-13', date: '2026-07-11', description: 'Water Bill', amount: 52, type: 'expense', category: 'Utilities', account: 'Main Checking' },
    { id: 'demo-tx-14', date: '2026-07-12', description: 'Brunch with Friends', amount: 45, type: 'expense', category: 'Dining Out', account: 'Rewards Credit Card' },
    { id: 'demo-tx-15', date: '2026-07-13', description: 'Target Run', amount: 120, type: 'expense', category: 'Shopping', account: 'Rewards Credit Card' },
    { id: 'demo-tx-16', date: '2026-07-14', description: 'Gym Membership', amount: 60, type: 'expense', category: 'Subscriptions', account: 'Main Checking' },
    { id: 'demo-tx-17', date: '2026-07-15', description: 'Spotify Premium', amount: 10, type: 'expense', category: 'Subscriptions', account: 'Main Checking' },
    { id: 'demo-tx-18', date: '2026-07-16', description: 'Movie Tickets', amount: 32, type: 'expense', category: 'Entertainment', account: 'Rewards Credit Card' },
    { id: 'demo-tx-19', date: '2026-07-17', description: 'CVS Pharmacy', amount: 28, type: 'expense', category: 'Healthcare', account: 'Rewards Credit Card' },
    { id: 'demo-tx-20', date: '2026-07-18', description: 'Auto Insurance', amount: 145, type: 'expense', category: 'Insurance', account: 'Main Checking' },
    { id: 'demo-tx-21', date: '2026-07-19', description: 'Chipotle Lunch', amount: 16, type: 'expense', category: 'Dining Out', account: 'Rewards Credit Card' },
    { id: 'demo-tx-22', date: '2026-07-20', description: 'Freelance Logo Design', amount: 600, type: 'income', category: 'Freelance', account: 'Main Checking' },
    { id: 'demo-tx-23', date: '2026-07-21', description: 'Internet Bill', amount: 80, type: 'expense', category: 'Utilities', account: 'Main Checking' },
    { id: 'demo-tx-24', date: '2026-07-22', description: 'Pizza Delivery', amount: 28, type: 'expense', category: 'Dining Out', account: 'Rewards Credit Card' },
    { id: 'demo-tx-25', date: '2026-07-23', description: 'Health Insurance', amount: 205, type: 'expense', category: 'Insurance', account: 'Main Checking' },
    { id: 'demo-tx-26', date: '2026-07-24', description: 'Concert Tickets', amount: 120, type: 'expense', category: 'Entertainment', account: 'Rewards Credit Card' },
    { id: 'demo-tx-27', date: '2026-07-25', description: 'Costco Wholesale', amount: 165, type: 'expense', category: 'Groceries', account: 'Rewards Credit Card' },
    { id: 'demo-tx-28', date: '2026-07-26', description: 'Phone Bill', amount: 75, type: 'expense', category: 'Utilities', account: 'Main Checking' },
    { id: 'demo-tx-29', date: '2026-07-27', description: 'Coffee Shop Meetings', amount: 34, type: 'expense', category: 'Dining Out', account: 'Rewards Credit Card' },
    { id: 'demo-tx-30', date: '2026-07-28', description: 'Online Course', amount: 200, type: 'expense', category: 'Entertainment', account: 'Main Checking' },
  ],
  savingsGoals: [
    { id: 'demo-sg-1', name: 'Emergency Fund', target: 20000, current: 15000, targetDate: '2026-12-31' },
    { id: 'demo-sg-2', name: 'Vacation Fund', target: 5000, current: 3200, targetDate: '2026-09-30' },
    { id: 'demo-sg-3', name: 'New Laptop', target: 2500, current: 1800, targetDate: '2026-08-31' },
  ],
  mortgage: {
    principal: 320000,
    rate: 3.5,
    term: 30,
    payment: 1436,
    remaining: 285000,
  },
};
