export type UserRole = 
  | 'qa' 
  | 'qc' 
  | 'production' 
  | 'regulatory' 
  | 'sales' 
  | 'management' 
  | 'admin';

export interface RoleConfig {
  id: UserRole;
  label: string;
  fullName: string;
  description: string;
  color: string;
  icon: string;
  accessScope: string[];
  restrictions: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  qa: {
    id: 'qa',
    label: 'QA',
    fullName: 'Quality Assurance',
    description: 'Deviation management, CAPA, SOP oversight, audit coordination',
    color: 'role-qa',
    icon: 'Shield',
    accessScope: [
      'Deviations (all departments)',
      'CAPA records',
      'SOPs (approved + draft)',
      'Audit observations & responses',
      'Change controls',
      'Training compliance records'
    ],
    restrictions: [
      'Commercial pricing',
      'Client contracts',
      'Sales negotiations'
    ]
  },
  qc: {
    id: 'qc',
    label: 'QC',
    fullName: 'Quality Control',
    description: 'Testing, OOS/OOT investigations, stability data, analytical methods',
    color: 'role-qc',
    icon: 'FlaskConical',
    accessScope: [
      'Test results',
      'OOS / OOT investigations',
      'Stability data (approved)',
      'Analytical SOPs',
      'Batch-specific QC reports'
    ],
    restrictions: [
      'Root cause discussions outside QC',
      'Commercial or regulatory strategy documents'
    ]
  },
  production: {
    id: 'production',
    label: 'Production',
    fullName: 'Production / Manufacturing',
    description: 'Batch records, equipment logs, manufacturing deviations',
    color: 'role-production',
    icon: 'Factory',
    accessScope: [
      'Batch Manufacturing Records (BMR)',
      'Equipment logs',
      'Deviations raised by production',
      'Approved SOPs only',
      'Change impact summaries'
    ],
    restrictions: [
      'Audit observations',
      'Regulatory correspondence',
      'Sales or pricing data'
    ]
  },
  regulatory: {
    id: 'regulatory',
    label: 'RA',
    fullName: 'Regulatory Affairs',
    description: 'Submissions, compliance mapping, inspection readiness',
    color: 'role-regulatory',
    icon: 'Scale',
    accessScope: [
      'Regulatory submissions',
      'SOP histories & version diffs',
      'Audit readiness data',
      'Inspection responses',
      'FDA / EMA / WHO correspondence',
      'Warning letter mappings'
    ],
    restrictions: [
      'Raw commercial data',
      'Internal employee performance notes'
    ]
  },
  sales: {
    id: 'sales',
    label: 'Sales',
    fullName: 'Sales & Business Development',
    description: 'Product capabilities, RFP responses, client dossiers',
    color: 'role-sales',
    icon: 'Briefcase',
    accessScope: [
      'Product capability summaries',
      'Approved RFP responses',
      'Client-specific dossiers',
      'High-level compliance status (green/yellow/red only)'
    ],
    restrictions: [
      'Deviation details',
      'CAPA root causes',
      'Draft SOPs',
      'Internal audit findings'
    ]
  },
  management: {
    id: 'management',
    label: 'Exec',
    fullName: 'Senior Management',
    description: 'Aggregated dashboards, risk indicators, trend analysis',
    color: 'role-management',
    icon: 'LayoutDashboard',
    accessScope: [
      'Aggregated dashboards only',
      'Cross-functional risk indicators',
      'Compliance health index',
      'Trend analysis'
    ],
    restrictions: [
      'No raw data access',
      'No document-level editing',
      'Read-only summaries only'
    ]
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    fullName: 'System Admin / IT',
    description: 'User management, role assignment, system health',
    color: 'role-admin',
    icon: 'Settings',
    accessScope: [
      'User management',
      'Role assignment',
      'System health',
      'Data ingestion status'
    ],
    restrictions: [
      'No content interpretation',
      'No business decisions'
    ]
  }
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  lastLogin: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  details?: string;
}
