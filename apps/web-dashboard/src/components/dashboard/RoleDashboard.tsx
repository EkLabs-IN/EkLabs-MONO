import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  FlaskConical,
  Factory,
  Scale,
  Briefcase,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';
import { DashboardStats, StatCard } from './DashboardStats';
import { ComplianceTable, ComplianceItem } from './ComplianceTable';

// Role-specific dashboard configurations
const ROLE_DASHBOARDS: Record<UserRole, {
  stats: Omit<React.ComponentProps<typeof StatCard>, 'icon'>[];
  statIcons: React.ComponentProps<typeof StatCard>['icon'][];
  tableTitle: string;
  items: ComplianceItem[];
}> = {
  qa: {
    stats: [
      { label: 'Open Deviations', value: 23, change: '+3 this week', changeType: 'negative' },
      { label: 'Overdue CAPAs', value: 5, change: '2 critical', changeType: 'negative' },
      { label: 'SOPs Due Review', value: 12, change: 'Next 30 days', changeType: 'neutral' },
      { label: 'Training Compliance', value: '94%', change: '+2%', changeType: 'positive' }
    ],
    statIcons: [AlertTriangle, Clock, FileText, CheckCircle2],
    tableTitle: 'Critical Deviations Requiring Attention',
    items: [
      { id: 'DEV-2024-0156', title: 'Temperature Excursion - Cold Storage Unit 3', type: 'Deviation', status: 'overdue', priority: 'high', dueDate: 'Dec 28, 2024', department: 'Manufacturing', assignee: 'J. Walsh' },
      { id: 'CAPA-2024-0089', title: 'Recurring OOS Investigation Enhancement', type: 'CAPA', status: 'in-progress', priority: 'high', dueDate: 'Jan 15, 2025', department: 'QC', assignee: 'M. Torres' },
      { id: 'DEV-2024-0152', title: 'Label Verification Failure - Batch 2024-089', type: 'Deviation', status: 'open', priority: 'medium', dueDate: 'Jan 5, 2025', department: 'Packaging', assignee: 'Unassigned' },
      { id: 'AUD-2024-0012', title: 'FDA 483 Response - Observation 2', type: 'Audit', status: 'in-progress', priority: 'high', dueDate: 'Jan 10, 2025', department: 'Quality', assignee: 'S. Chen' }
    ]
  },
  qc: {
    stats: [
      { label: 'Pending Tests', value: 47, change: '12 urgent', changeType: 'neutral' },
      { label: 'Open OOS', value: 3, change: '-2 this week', changeType: 'positive' },
      { label: 'Stability Studies', value: 18, change: 'Active', changeType: 'neutral' },
      { label: 'Method Validation', value: 6, change: 'In progress', changeType: 'neutral' }
    ],
    statIcons: [FlaskConical, AlertTriangle, TrendingUp, FileText],
    tableTitle: 'Active OOS/OOT Investigations',
    items: [
      { id: 'OOS-2024-0034', title: 'Dissolution Failure - Product X Batch 2024-091', type: 'OOS', status: 'in-progress', priority: 'high', dueDate: 'Jan 3, 2025', department: 'QC Lab', assignee: 'M. Torres' },
      { id: 'OOT-2024-0089', title: 'Assay Trending - Product Y Stability', type: 'OOT', status: 'open', priority: 'medium', dueDate: 'Jan 8, 2025', department: 'Stability', assignee: 'A. Johnson' },
      { id: 'OOS-2024-0033', title: 'Microbial Limit Exceedance - Raw Material', type: 'OOS', status: 'in-progress', priority: 'high', dueDate: 'Jan 2, 2025', department: 'Microbiology', assignee: 'L. Garcia' }
    ]
  },
  production: {
    stats: [
      { label: 'Active Batches', value: 8, change: '3 in granulation', changeType: 'neutral' },
      { label: 'Equipment Alerts', value: 2, change: 'Maintenance due', changeType: 'negative' },
      { label: 'Open Deviations', value: 4, change: 'Your area', changeType: 'neutral' },
      { label: 'Batch Yield', value: '98.2%', change: 'This month', changeType: 'positive' }
    ],
    statIcons: [Factory, Settings, AlertTriangle, TrendingUp],
    tableTitle: 'Today\'s Production Status',
    items: [
      { id: 'BMR-2024-0234', title: 'Batch 2024-095 - Granulation Complete', type: 'BMR', status: 'in-progress', priority: 'medium', department: 'Manufacturing', assignee: 'J. Walsh' },
      { id: 'BMR-2024-0235', title: 'Batch 2024-096 - Coating In Progress', type: 'BMR', status: 'in-progress', priority: 'medium', department: 'Manufacturing', assignee: 'R. Smith' },
      { id: 'EQ-2024-0089', title: 'Fluid Bed Dryer - PM Due', type: 'Equipment', status: 'open', priority: 'high', dueDate: 'Jan 5, 2025', department: 'Maintenance', assignee: 'Tech Team' }
    ]
  },
  regulatory: {
    stats: [
      { label: 'Open Submissions', value: 4, change: '2 FDA, 1 EMA, 1 WHO', changeType: 'neutral' },
      { label: 'Audit Readiness', value: '87%', change: '+5%', changeType: 'positive' },
      { label: 'Pending Changes', value: 12, change: 'Regulatory review', changeType: 'neutral' },
      { label: 'Warning Letters', value: 0, change: 'Clear status', changeType: 'positive' }
    ],
    statIcons: [Scale, CheckCircle2, FileText, Shield],
    tableTitle: 'Regulatory Actions Required',
    items: [
      { id: 'SUB-2024-0023', title: 'ANDA Supplement - Manufacturing Site Change', type: 'Submission', status: 'in-progress', priority: 'high', dueDate: 'Jan 20, 2025', department: 'Regulatory', assignee: 'D. Kim' },
      { id: 'INS-2024-0005', title: 'Pre-Approval Inspection Response', type: 'Inspection', status: 'open', priority: 'high', dueDate: 'Jan 15, 2025', department: 'Regulatory', assignee: 'D. Kim' },
      { id: 'CHG-2024-0156', title: 'API Supplier Change Assessment', type: 'Change Control', status: 'in-progress', priority: 'medium', dueDate: 'Feb 1, 2025', department: 'Regulatory', assignee: 'K. Patel' }
    ]
  },
  sales: {
    stats: [
      { label: 'Active RFPs', value: 7, change: '3 due this week', changeType: 'neutral' },
      { label: 'Compliance Score', value: 'Green', change: 'All products', changeType: 'positive' },
      { label: 'Client Reviews', value: 4, change: 'Pending', changeType: 'neutral' },
      { label: 'Products Available', value: 23, change: 'For proposal', changeType: 'neutral' }
    ],
    statIcons: [Briefcase, CheckCircle2, Users, FileText],
    tableTitle: 'Pending Client Requests',
    items: [
      { id: 'RFP-2024-0089', title: 'GlobalPharma Inc - API Supply Agreement', type: 'RFP', status: 'in-progress', priority: 'high', dueDate: 'Jan 8, 2025', department: 'Sales', assignee: 'A. Foster' },
      { id: 'RFP-2024-0091', title: 'MediCorp - Contract Manufacturing', type: 'RFP', status: 'open', priority: 'medium', dueDate: 'Jan 15, 2025', department: 'Sales', assignee: 'B. Johnson' },
      { id: 'REQ-2024-0234', title: 'Client Audit Request - PharmaTech', type: 'Client Request', status: 'open', priority: 'high', dueDate: 'Jan 10, 2025', department: 'Quality', assignee: 'S. Chen' }
    ]
  },
  management: {
    stats: [
      { label: 'Compliance Index', value: '91%', change: '+3% QoQ', changeType: 'positive' },
      { label: 'Risk Score', value: 'Low', change: '2 areas elevated', changeType: 'neutral' },
      { label: 'Open Issues', value: 34, change: '-8 from last month', changeType: 'positive' },
      { label: 'Audit Status', value: 'Ready', change: 'Next: Feb 2025', changeType: 'neutral' }
    ],
    statIcons: [LayoutDashboard, Activity, AlertTriangle, Shield],
    tableTitle: 'Executive Risk Summary',
    items: [
      { id: 'RISK-001', title: 'Manufacturing Capacity Constraint Q1 2025', type: 'Risk', status: 'in-progress', priority: 'high', department: 'Operations', assignee: 'VP Manufacturing' },
      { id: 'RISK-002', title: 'API Supply Chain Vulnerability', type: 'Risk', status: 'open', priority: 'medium', department: 'Procurement', assignee: 'VP Supply Chain' },
      { id: 'COMP-001', title: 'Training Compliance Below Target - Packaging', type: 'Compliance', status: 'in-progress', priority: 'medium', department: 'HR', assignee: 'Training Manager' }
    ]
  },
  admin: {
    stats: [
      { label: 'Active Users', value: 156, change: '+4 this week', changeType: 'neutral' },
      { label: 'System Health', value: '99.8%', change: 'Uptime', changeType: 'positive' },
      { label: 'Data Sync', value: 'Current', change: 'Last: 2 min ago', changeType: 'positive' },
      { label: 'Pending Requests', value: 3, change: 'Access requests', changeType: 'neutral' }
    ],
    statIcons: [Users, Activity, TrendingUp, Settings],
    tableTitle: 'System Administration Queue',
    items: [
      { id: 'USR-2024-0345', title: 'New User Access Request - Regulatory Team', type: 'Access', status: 'open', priority: 'medium', dueDate: 'Jan 3, 2025', department: 'IT', assignee: 'Admin' },
      { id: 'SYS-2024-0089', title: 'Database Maintenance Window', type: 'System', status: 'in-progress', priority: 'low', dueDate: 'Jan 5, 2025', department: 'IT', assignee: 'DBA Team' },
      { id: 'AUD-2024-0156', title: 'User Access Review - Q4 2024', type: 'Audit', status: 'open', priority: 'high', dueDate: 'Jan 10, 2025', department: 'IT', assignee: 'Admin' }
    ]
  }
};

export function RoleDashboard() {
  const { user } = useAuth();

  if (!user || !user.role) return null;

  const roleConfig = ROLE_CONFIGS[user.role];
  const dashboardConfig = ROLE_DASHBOARDS[user.role];
  
  if (!roleConfig || !dashboardConfig) return null;

  const stats = dashboardConfig.stats.map((stat, idx) => ({
    ...stat,
    icon: dashboardConfig.statIcons[idx]
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            {roleConfig.fullName} Dashboard • {roleConfig.description}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last login</p>
          <p className="text-sm font-mono text-foreground">
            {new Date(user.lastLogin).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <DashboardStats stats={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items table - 2 columns */}
        <div className="lg:col-span-2">
          <ComplianceTable
            title={dashboardConfig.tableTitle}
            items={dashboardConfig.items}
          />
        </div>

        {/* Access scope panel */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Your Access Scope
            </h3>
            <ul className="space-y-2">
              {roleConfig.accessScope.slice(0, 5).map((scope, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-status-compliant flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{scope}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              Access Restrictions
            </h3>
            <ul className="space-y-2">
              {roleConfig.restrictions.map((restriction, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-critical" />
                  </span>
                  <span className="text-muted-foreground">{restriction}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
