import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useHealthStore } from '@/stores/intelligence/healthStore';

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning';
  icon: string;
}

const SEVERITY_STYLES = {
  info: { bg: 'var(--accent-muted)', text: 'var(--accent-text)', icon: '💡' },
  positive: { bg: 'color-mix(in srgb, var(--status-success) 15%, transparent)', text: 'var(--status-success)', icon: '✅' },
  warning: { bg: 'color-mix(in srgb, var(--status-warning) 15%, transparent)', text: 'var(--status-warning)', icon: '⚠️' },
};

export const AIInsightCard = memo(function AIInsightCard() {
  const healthResult = useHealthStore((s) => s.result);

  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];

    if (healthResult) {
      if (healthResult.overallScore >= 80) {
        result.push({
          id: 'health-excellent',
          title: 'Excellent Financial Health',
          description: 'Your financial health score is strong. Keep up the great work!',
          severity: 'positive',
          icon: '✅',
        });
      } else if (healthResult.overallScore >= 60) {
        result.push({
          id: 'health-good',
          title: 'Good Financial Health',
          description: 'You\'re on the right track. Review suggestions to improve further.',
          severity: 'info',
          icon: '💡',
        });
      } else {
        result.push({
          id: 'health-attention',
          title: 'Attention Needed',
          description: 'Your financial health needs improvement. Check the health tab for details.',
          severity: 'warning',
          icon: '⚠️',
        });
      }

      if (healthResult.improvementSuggestions.length > 0) {
        const top = healthResult.improvementSuggestions[0]!;
        result.push({
          id: 'top-suggestion',
          title: top.category ?? 'Suggestion',
          description: top.message,
          severity: 'info',
          icon: '💡',
        });
      }
    }

    if (result.length === 0) {
      result.push({
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Add accounts and transactions to see personalized insights.',
        severity: 'info',
        icon: '🚀',
      });
    }

    return result.slice(0, 3);
  }, [healthResult]);

  return (
    <DashboardCard title="AI Insights" delay={0.3}>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const style = SEVERITY_STYLES[insight.severity];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              className="rounded-xl p-3"
              style={{ background: style.bg }}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{insight.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: style.text }}>{insight.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
});
