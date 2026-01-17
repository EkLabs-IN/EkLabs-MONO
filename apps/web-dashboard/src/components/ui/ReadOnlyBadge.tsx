import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadOnlyBadgeProps {
  className?: string;
}

export function ReadOnlyBadge({ className }: ReadOnlyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground',
        className
      )}
    >
      <Lock className="w-3 h-3" />
      Read Only
    </span>
  );
}
