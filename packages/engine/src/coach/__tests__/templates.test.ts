import { describe, it, expect } from 'vitest';
import { createTemplate, interpolateTemplate, DEFAULT_TEMPLATES } from '../templates';

describe('createTemplate', () => {
  it('creates a template with correct properties', () => {
    const template = createTemplate('alert', 'budget', 'Test Title', 'Test message {var}', 1);
    expect(template.type).toBe('alert');
    expect(template.category).toBe('budget');
    expect(template.title).toBe('Test Title');
    expect(template.messageTemplate).toBe('Test message {var}');
    expect(template.priority).toBe(1);
  });

  it('creates template with different type', () => {
    const template = createTemplate('tip', 'spending', 'Tip Title', 'Tip message', 3);
    expect(template.type).toBe('tip');
    expect(template.category).toBe('spending');
  });

  it('creates template with win type', () => {
    const template = createTemplate('win', 'savings', 'Win Title', 'Win message', 4);
    expect(template.type).toBe('win');
    expect(template.category).toBe('savings');
  });

  it('creates template with insight type', () => {
    const template = createTemplate('insight', 'health', 'Insight Title', 'Insight message', 2);
    expect(template.type).toBe('insight');
    expect(template.category).toBe('health');
  });
});

describe('interpolateTemplate', () => {
  it('replaces single variable', () => {
    const result = interpolateTemplate('Hello {name}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('replaces multiple variables', () => {
    const result = interpolateTemplate('{greeting} {name}!', { greeting: 'Hello', name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('leaves unresolved variables as-is', () => {
    const result = interpolateTemplate('Hello {name}', {});
    expect(result).toBe('Hello {name}');
  });

  it('handles numeric variables', () => {
    const result = interpolateTemplate('Score: {score}', { score: 85 });
    expect(result).toBe('Score: 85');
  });

  it('handles empty template', () => {
    const result = interpolateTemplate('', { name: 'World' });
    expect(result).toBe('');
  });

  it('handles no variables', () => {
    const result = interpolateTemplate('Hello World', {});
    expect(result).toBe('Hello World');
  });

  it('handles multiple same variables', () => {
    const result = interpolateTemplate('{x} and {x}', { x: 'same' });
    expect(result).toBe('same and same');
  });

  it('handles special characters in variables', () => {
    const result = interpolateTemplate('Amount: {amount}', { amount: '$1,234.56' });
    expect(result).toBe('Amount: $1,234.56');
  });
});

describe('DEFAULT_TEMPLATES', () => {
  it('has templates for all categories', () => {
    const categories = DEFAULT_TEMPLATES.map((t) => t.category);
    expect(categories).toContain('budget');
    expect(categories).toContain('spending');
    expect(categories).toContain('savings');
    expect(categories).toContain('health');
  });

  it('has templates for all types', () => {
    const types = DEFAULT_TEMPLATES.map((t) => t.type);
    expect(types).toContain('alert');
    expect(types).toContain('tip');
    expect(types).toContain('win');
    expect(types).toContain('insight');
  });

  it('has correct priorities', () => {
    const priorities = DEFAULT_TEMPLATES.map((t) => t.priority);
    expect(priorities).toContain(1);
    expect(priorities).toContain(2);
    expect(priorities).toContain(3);
    expect(priorities).toContain(4);
  });

  it('has budget alert template with variables', () => {
    const budgetAlert = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'alert' && t.category === 'budget' && t.title.includes('{category}'),
    );
    expect(budgetAlert).toBeDefined();
    expect(budgetAlert?.messageTemplate).toContain('{percentUsed}');
    expect(budgetAlert?.messageTemplate).toContain('{remaining}');
  });

  it('has spending alert template', () => {
    const spendingAlert = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'alert' && t.category === 'spending',
    );
    expect(spendingAlert).toBeDefined();
    expect(spendingAlert?.messageTemplate).toContain('{spendPercent}');
  });

  it('has subscription audit tip', () => {
    const subscriptionTip = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'tip' && t.category === 'spending' && t.title.includes('Subscription'),
    );
    expect(subscriptionTip).toBeDefined();
    expect(subscriptionTip?.messageTemplate).toContain('{count}');
    expect(subscriptionTip?.messageTemplate).toContain('{total}');
  });

  it('has budget win template', () => {
    const budgetWin = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'win' && t.category === 'savings' && t.title.includes('Budget Win'),
    );
    expect(budgetWin).toBeDefined();
  });

  it('has goal progress template', () => {
    const goalProgress = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'win' && t.category === 'savings' && t.title.includes('Goal'),
    );
    expect(goalProgress).toBeDefined();
    expect(goalProgress?.messageTemplate).toContain('{name}');
    expect(goalProgress?.messageTemplate).toContain('{percent}');
    expect(goalProgress?.messageTemplate).toContain('{status}');
  });

  it('has spending insight template', () => {
    const spendingInsight = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'insight' && t.category === 'health' && t.title.includes('Spending'),
    );
    expect(spendingInsight).toBeDefined();
    expect(spendingInsight?.messageTemplate).toContain('{category}');
    expect(spendingInsight?.messageTemplate).toContain('{percent}');
  });

  it('has health score trend template', () => {
    const healthTrend = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'insight' && t.category === 'health' && t.title.includes('Health Score'),
    );
    expect(healthTrend).toBeDefined();
    expect(healthTrend?.messageTemplate).toContain('{trend}');
    expect(healthTrend?.messageTemplate).toContain('{delta}');
  });

  it('has account low balance template', () => {
    const lowBalance = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'alert' && t.category === 'budget' && t.title.includes('Account'),
    );
    expect(lowBalance).toBeDefined();
    expect(lowBalance?.messageTemplate).toContain('{account}');
    expect(lowBalance?.messageTemplate).toContain('{balance}');
  });

  it('has potential savings tip', () => {
    const savingsTip = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'tip' && t.category === 'spending' && t.title.includes('Potential'),
    );
    expect(savingsTip).toBeDefined();
    expect(savingsTip?.messageTemplate).toContain('{amount}');
  });

  it('has round-up savings tip', () => {
    const roundUp = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'tip' && t.category === 'savings' && t.title.includes('Round'),
    );
    expect(roundUp).toBeDefined();
    expect(roundUp?.messageTemplate).toContain('{potentialSavings}');
  });

  it('has net worth milestone template', () => {
    const netWorth = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'win' && t.category === 'health' && t.title.includes('Net Worth'),
    );
    expect(netWorth).toBeDefined();
    expect(netWorth?.messageTemplate).toContain('{amount}');
    expect(netWorth?.messageTemplate).toContain('{percent}');
  });

  it('has income insight template', () => {
    const incomeInsight = DEFAULT_TEMPLATES.find(
      (t) => t.type === 'insight' && t.category === 'health' && t.title.includes('Income'),
    );
    expect(incomeInsight).toBeDefined();
    expect(incomeInsight?.messageTemplate).toContain('{direction}');
    expect(incomeInsight?.messageTemplate).toContain('{amount}');
  });

  it('all templates have required fields', () => {
    for (const template of DEFAULT_TEMPLATES) {
      expect(template.type).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.title).toBeDefined();
      expect(template.messageTemplate).toBeDefined();
      expect(template.priority).toBeGreaterThan(0);
    }
  });
});
