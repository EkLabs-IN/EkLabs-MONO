import { Clock, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export interface ComplianceItem {
  id: string;
  title: string;
  type: string;
  status: 'open' | 'in-progress' | 'overdue' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignee?: string;
  department: string;
}

interface ComplianceTableProps {
  title: string;
  items: ComplianceItem[];
  emptyMessage?: string;
}

const statusConfig = {
  open: { label: 'Open', variant: 'info' as const, icon: Clock },
  'in-progress': { label: 'In Progress', variant: 'warning' as const, icon: AlertCircle },
  overdue: { label: 'Overdue', variant: 'critical' as const, icon: AlertTriangle },
  completed: { label: 'Completed', variant: 'approved' as const, icon: CheckCircle2 }
};

const priorityStyles = {
  high: 'text-status-critical',
  medium: 'text-status-warning',
  low: 'text-muted-foreground'
};

export function ComplianceTable({ title, items, emptyMessage = 'No items to display' }: ComplianceTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="px-5 py-4 hover:bg-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    item.status === 'overdue' ? 'bg-status-critical-bg' : 'bg-muted'
                  )}>
                    <StatusIcon className={cn(
                      'w-4 h-4',
                      item.status === 'overdue' ? 'text-status-critical' : 'text-muted-foreground'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                      <span className={cn('text-xs font-medium', priorityStyles[item.priority])}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1 mb-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.department}</span>
                      {item.dueDate && (
                        <>
                          <span>•</span>
                          <span className={cn(
                            item.status === 'overdue' && 'text-status-critical font-medium'
                          )}>
                            Due: {item.dueDate}
                          </span>
                        </>
                      )}
                      {item.assignee && (
                        <>
                          <span>•</span>
                          <span>{item.assignee}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge variant={status.variant} size="sm">
                      {status.label}
                    </StatusBadge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
