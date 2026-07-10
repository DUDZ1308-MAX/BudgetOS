import type { Recommendation, IntelligenceInput, RecommendationPriority } from './types';

let recCounter = 0;

function nextId(): string {
  recCounter++;
  return `rec_${Date.now()}_${recCounter}`;
}

export function generateRecommendations(input: IntelligenceInput): Recommendation[] {
  const recs: Recommendation[] = [];
  const now = new Date().toISOString();

  recs.push(...budgetRecommendations(input, now));
  recs.push(...savingsRecommendations(input, now));
  recs.push(...mortgageRecommendations(input, now));
  recs.push(...spendingRecommendations(input, now));

  return recs.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

function budgetRecommendations(input: IntelligenceInput, now: string): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const cat of input.budgetSummary.budgetStatus.overBudget) {
    const overspent = cat.spent - cat.budgeted;
    const reductionTarget = Math.round(overspent * 0.5);

    recs.push({
      id: nextId(),
      priority: 'high',
      category: 'budget',
      title: `Reduce ${cat.categoryName} spending`,
      description: `Cut ${cat.categoryName} spending by ~$${reductionTarget}/mo to get back within budget.`,
      estimatedImpact: `Save ~$${Math.round(reductionTarget * 12)}/year`,
      reasoning: `Currently spending $${Math.round(cat.spent)} against $${Math.round(cat.budgeted)} budget (${Math.round(cat.percentUsed)}% used).`,
      confidence: 0.85,
      action: {
        type: 'view_budget',
        label: 'Adjust Budget',
        params: { categoryId: cat.categoryId },
      },
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

function savingsRecommendations(input: IntelligenceInput, now: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const { savingsCapacity } = input.budgetSummary;
  const rate = savingsCapacity.savingsRate;

  if (rate < 20 && savingsCapacity.surplus > 0) {
    const increaseAmount = Math.round(savingsCapacity.surplus * 0.3);

    recs.push({
      id: nextId(),
      priority: rate < 10 ? 'high' : 'medium',
      category: 'savings',
      title: rate < 10 ? 'Increase savings rate urgently' : 'Boost monthly savings',
      description: `Increase monthly savings by ~$${increaseAmount} to reach a healthier savings rate.`,
      estimatedImpact: `Build ~$${Math.round(increaseAmount * 12)} in savings over the next year`,
      reasoning: `Current savings rate is ${Math.round(rate)}%. Recommended minimum is 20%.`,
      confidence: 0.75,
      action: {
        type: 'adjust_savings',
        label: 'Set Up Auto-Save',
        params: { amount: increaseAmount },
      },
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  for (const goal of input.savingsGoals) {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    if (target <= 0 || current >= target) continue;

    if (goal.target_date) {
      const monthsLeft = Math.max(1, Math.round(
        (new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
      ));
      const remaining = target - current;
      const neededPerMonth = Math.round(remaining / monthsLeft);
      if (neededPerMonth > 0 && savingsCapacity.surplus >= neededPerMonth) {
        recs.push({
          id: nextId(),
          priority: 'medium',
          category: 'savings',
          title: `Stay on track: ${goal.name}`,
          description: `Contribute ~$${neededPerMonth}/mo to reach your "${goal.name}" goal on time.`,
          estimatedImpact: `Achieve goal by ${new Date(goal.target_date).toLocaleDateString()}`,
          reasoning: `You need $${Math.round(remaining)} more over ${monthsLeft} months to meet your target.`,
          confidence: 0.8,
          action: {
            type: 'adjust_savings',
            label: 'Set Up Contribution',
            params: { goalId: goal.id, amount: neededPerMonth },
          },
          dismissed: false,
          applied: false,
          createdAt: now,
        });
      }
    }
  }

  return recs;
}

function mortgageRecommendations(input: IntelligenceInput, now: string): Recommendation[] {
  if (!input.mortgageData) return [];

  const recs: Recommendation[] = [];
  const monthlyPayment = input.mortgageData.monthlyPayment;
  const extraAmount = Math.round(monthlyPayment * 0.1);

  recs.push({
    id: nextId(),
    priority: 'medium',
    category: 'mortgage',
    title: 'Pay extra toward mortgage principal',
    description: `Add ~$${extraAmount}/mo to your mortgage payment to pay down principal faster.`,
    estimatedImpact: `Save thousands in interest and pay off mortgage years earlier`,
    reasoning: `Adding ${Math.round((extraAmount / monthlyPayment) * 100)}% to each payment significantly reduces total interest.`,
    confidence: 0.7,
    action: {
      type: 'adjust_mortgage',
      label: 'Set Up Extra Payment',
      params: { amount: extraAmount },
    },
    dismissed: false,
    applied: false,
    createdAt: now,
  });

  return recs;
}

function spendingRecommendations(input: IntelligenceInput, now: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const { expenses } = input.budgetSummary;

  for (const cat of expenses.byCategory) {
    if (cat.percentage > 25 && cat.categoryName !== 'Housing') {
      const reductionTarget = Math.round(cat.amount * 0.1);
      recs.push({
        id: nextId(),
        priority: cat.percentage > 35 ? 'medium' : 'low',
        category: 'spending',
        title: `Optimize ${cat.categoryName} spending`,
        description: `Reduce ${cat.categoryName} by ~$${reductionTarget}/mo (10% cut).`,
        estimatedImpact: `Save ~$${Math.round(reductionTarget * 12)}/year`,
        reasoning: `${cat.categoryName} makes up ${Math.round(cat.percentage)}% of total spending.`,
        confidence: 0.65,
        dismissed: false,
        applied: false,
        createdAt: now,
      });
    }
  }

  return recs;
}

function priorityWeight(p: RecommendationPriority): number {
  return p === 'critical' ? 4 : p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}
