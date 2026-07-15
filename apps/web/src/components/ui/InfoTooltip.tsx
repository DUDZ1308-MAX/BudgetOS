import { Tooltip } from './Tooltip';
import { IconHelp } from './Icons';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position="top">
      <button
        type="button"
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 ${className ?? ''}`}
        tabIndex={0}
        aria-label="More info"
      >
        <IconHelp className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}
