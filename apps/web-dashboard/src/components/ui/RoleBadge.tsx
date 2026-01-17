import { cn } from '@/lib/utils';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';

interface RoleBadgeProps {
  role: UserRole;
  showFullName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const roleColors: Record<UserRole, string> = {
  qa: 'bg-role-qa/10 text-role-qa border-role-qa/20',
  qc: 'bg-role-qc/10 text-role-qc border-role-qc/20',
  production: 'bg-role-production/10 text-role-production border-role-production/20',
  regulatory: 'bg-role-regulatory/10 text-role-regulatory border-role-regulatory/20',
  sales: 'bg-role-sales/10 text-role-sales border-role-sales/20',
  management: 'bg-role-management/10 text-role-management border-role-management/20',
  admin: 'bg-role-admin/10 text-role-admin border-role-admin/20'
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

export function RoleBadge({ role, showFullName = false, size = 'md', className }: RoleBadgeProps) {
  const config = ROLE_CONFIGS[role];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md',
        roleColors[role],
        sizeStyles[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', `bg-role-${role}`)} />
      {showFullName ? config.fullName : config.label}
    </span>
  );
}
