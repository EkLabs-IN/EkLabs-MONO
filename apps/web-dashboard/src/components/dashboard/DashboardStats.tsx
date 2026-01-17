import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-compliance-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          iconColor || 'bg-primary/10'
        )}>
          <Icon className={cn('w-5 h-5', iconColor ? 'text-current' : 'text-primary')} />
        </div>
        {change && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            changeType === 'positive' && 'bg-status-compliant-bg text-status-compliant',
            changeType === 'negative' && 'bg-status-critical-bg text-status-critical',
            changeType === 'neutral' && 'bg-muted text-muted-foreground'
          )}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface DashboardStatsProps {
  stats: StatCardProps[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
}
