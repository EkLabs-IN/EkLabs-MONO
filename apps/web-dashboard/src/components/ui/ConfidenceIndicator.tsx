import { cn } from '@/lib/utils';
import { ConfidenceLevel } from '@/types/query';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  score: number;
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  high: {
    color: 'bg-confidence-high',
    label: 'High Confidence',
    textColor: 'text-confidence-high'
  },
  medium: {
    color: 'bg-confidence-medium',
    label: 'Medium Confidence',
    textColor: 'text-confidence-medium'
  },
  low: {
    color: 'bg-confidence-low',
    label: 'Low Confidence',
    textColor: 'text-confidence-low'
  }
};

export function ConfidenceIndicator({ level, score, showLabel = true, className }: ConfidenceIndicatorProps) {
  const config = levelConfig[level];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="confidence-bar w-20">
        <div
          className={cn('confidence-fill', config.color)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', config.textColor)}>
          {score}% • {config.label}
        </span>
      )}
    </div>
  );
}
