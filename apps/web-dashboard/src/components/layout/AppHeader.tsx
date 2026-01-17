import { Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { user } = useAuth();

  if (!user || !user.name) return null;

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ReadOnlyBadge />
        <RoleBadge role={user.role} showFullName />
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full" />
          </button>
          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">
              {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
