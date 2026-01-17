import { cn } from '@/lib/utils';

type BadgeVariant = 'approved' | 'draft' | 'warning' | 'critical' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  approved: 'bg-status-compliant-bg text-status-compliant border-status-compliant/20',
  draft: 'bg-status-draft-bg text-status-draft border-status-draft/20',
  warning: 'bg-status-warning-bg text-status-warning border-status-warning/20',
  critical: 'bg-status-critical-bg text-status-critical border-status-critical/20',
  info: 'bg-status-info-bg text-status-info border-status-info/20',
  neutral: 'bg-muted text-muted-foreground border-border'
};

export function StatusBadge({ variant, children, className, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-md',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
