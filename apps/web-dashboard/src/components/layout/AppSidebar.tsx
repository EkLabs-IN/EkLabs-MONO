import { 
  Shield, 
  FlaskConical, 
  Factory, 
  Scale, 
  Briefcase, 
  LayoutDashboard, 
  Settings,
  Search,
  FileText,
  History,
  Bell,
  LogOut,
  ChevronRight,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';
import { RoleBadge } from '@/components/ui/RoleBadge';

const roleIcons: Record<UserRole, React.ElementType> = {
  qa: Shield,
  qc: FlaskConical,
  production: Factory,
  regulatory: Scale,
  sales: Briefcase,
  management: LayoutDashboard,
  admin: Settings
};

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

interface AppSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const RoleIcon = roleIcons[user.role];
  const roleConfig = ROLE_CONFIGS[user.role];

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: Home, href: 'dashboard' },
    { label: 'Query', icon: Search, href: 'query' },
    { label: 'Documents', icon: FileText, href: 'documents' },
    { label: 'History', icon: History, href: 'history' },
    { label: 'Notifications', icon: Bell, href: 'notifications', badge: 3 }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-primary">PharmaAI</h1>
            <p className="text-xs text-sidebar-foreground/60">Knowledge Agent</p>
          </div>
        </div>
      </div>

      {/* Role indicator */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            `bg-role-${user.role}/20`
          )}>
            <RoleIcon className={cn('w-5 h-5', `text-role-${user.role}`)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-primary truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{roleConfig.fullName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeView === item.href
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-status-warning text-white">
                {item.badge}
              </span>
            )}
            {activeView === item.href && (
              <ChevronRight className="w-4 h-4 text-sidebar-foreground/50" />
            )}
          </button>
        ))}
      </nav>

      {/* Access scope reminder */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3">
          <p className="text-xs font-medium text-sidebar-foreground/80 mb-1">Access Scope</p>
          <p className="text-xs text-sidebar-foreground/50 line-clamp-2">
            {roleConfig.accessScope[0]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
        <p className="mt-3 text-xs text-sidebar-foreground/40 text-center font-mono">
          Session: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </aside>
  );
}
