const suggestionGroups = [
  {
    label: 'Spending',
    items: [
      'How much did I spend on groceries last month?',
      'Where can I save money?',
      'What is my biggest expense?',
    ],
  },
  {
    label: 'Planning',
    items: [
      'Can I afford a $2,000 vacation?',
      'How long until I reach my savings goal?',
      'What happens if I pay an extra $250 toward my mortgage?',
    ],
  },
  {
    label: 'Insights',
    items: [
      'Why is my budget health score low?',
      'Generate a monthly financial summary',
    ],
  },
];

interface SuggestionChipsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="space-y-3 px-4 pb-3">
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Try asking:</p>
      {suggestionGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-600">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((q) => (
              <button
                key={q}
                onClick={() => onSelect(q)}
                disabled={disabled}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
