const suggestions = [
  'How much did I spend on groceries last month?',
  'Where can I save money?',
  'Can I afford a $2,000 vacation?',
  'What is my biggest expense?',
  'Why is my budget health score low?',
  'How long until I reach my savings goal?',
  'What happens if I pay an extra $250 toward my mortgage?',
  'Generate a monthly financial summary',
];

interface SuggestionChipsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
