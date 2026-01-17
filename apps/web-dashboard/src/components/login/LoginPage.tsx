import { useState } from 'react';
import { 
  Shield, 
  FlaskConical, 
  Factory, 
  Scale, 
  Briefcase, 
  LayoutDashboard, 
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const roleIcons: Record<UserRole, React.ElementType> = {
  qa: Shield,
  qc: FlaskConical,
  production: Factory,
  regulatory: Scale,
  sales: Briefcase,
  management: LayoutDashboard,
  admin: Settings
};

export function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select your role');
      return;
    }
    if (!email || !password) {
      setError('Please enter your credentials');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await login(email, password, selectedRole);
    
    if (!success) {
      setError('Invalid credentials');
    }
    setIsLoading(false);
  };

  const roles = Object.values(ROLE_CONFIGS);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PharmaAI</h1>
                <p className="text-sm text-primary-foreground/70">Knowledge Agent</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              GxP-Compliant<br />
              Intelligence Platform
            </h2>
            <p className="text-lg text-primary-foreground/70 max-w-md">
              Role-segregated access to pharmaceutical knowledge with full audit traceability and regulatory compliance.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Complete Audit Trail</h3>
                <p className="text-sm text-primary-foreground/60">Every query and access is logged for 21 CFR Part 11 compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-Based Access Control</h3>
                <p className="text-sm text-primary-foreground/60">Segregated data access based on department and responsibility</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/40">
            © 2024 PharmaAI • On-Premise Deployment • All interactions are logged
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PharmaAI</h1>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to your account</h2>
          <p className="text-muted-foreground mb-8">Select your role and enter your credentials</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const Icon = roleIcons[role.id];
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-left transition-all',
                        selectedRole === role.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        `bg-role-${role.id}/10`
                      )}>
                        <Icon className={cn('w-4 h-4', `text-role-${role.id}`)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{role.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{role.fullName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-status-critical-bg text-status-critical text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            This system is for authorized use only. All access is logged and audited.
          </p>
        </div>
      </div>
    </div>
  );
}
