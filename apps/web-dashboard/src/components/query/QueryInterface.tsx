import { useState } from 'react';
import { Search, Send, Sparkles, Clock, FileText, AlertTriangle, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfidenceIndicator } from '@/components/ui/ConfidenceIndicator';
import { QueryResponse, SourceDocument, QueryHistoryItem } from '@/types/query';
import { ROLE_CONFIGS } from '@/types/roles';
// NOTE: API integration is intentionally disabled for now.
// We will re-enable apiClient usage once the backend query service is ready.

// Sample data for demonstration
const SAMPLE_QUERIES: Record<string, string[]> = {
  qa: [
    'Show recurring deviations linked to HVAC in last 12 months',
    'CAPA status for open deviations in manufacturing',
    'Training compliance status by department'
  ],
  qc: [
    'Any historical OOS for Product X, Test Y?',
    'Stability failures in Q4 2024',
    'Trending OOT investigations'
  ],
  production: [
    'Similar deviations during granulation step?',
    'Equipment maintenance due this week',
    'BMR completion status for Batch 2024-001'
  ],
  regulatory: [
    'All deviations cited in last USFDA inspection',
    'SOP changes pending regulatory review',
    'Audit readiness score by area'
  ],
  sales: [
    'Can we support Product X for EU market?',
    'Client compliance requirements summary',
    'Product capability for RFP-2024-089'
  ],
  management: [
    'Compliance risk overview this quarter',
    'Cross-functional deviation trends',
    'Resource allocation vs compliance goals'
  ],
  admin: [
    'System health status',
    'User activity last 30 days',
    'Data ingestion queue status'
  ]
};

const SAMPLE_RESPONSES: Record<string, QueryResponse[]> = {
  qa: [
    {
      id: 'resp-qa-001',
      timestamp: new Date().toISOString(),
      query: 'Show recurring deviations linked to HVAC in last 12 months',
      summary: `Analysis of HVAC-related deviations over the past 12 months reveals 14 documented incidents across 3 manufacturing areas. The primary root causes identified are:

1. **Filter replacement delays** (6 incidents) - Linked to supply chain issues in Q2 2024
2. **Temperature excursions** (5 incidents) - Concentrated in Building B, Area 3
3. **Pressure differential failures** (3 incidents) - Associated with aging equipment

Corrective actions have been implemented for 11 of 14 deviations. 3 CAPAs remain open with target completion dates in February 2025.`,
      confidence: 'high',
      confidenceScore: 92,
      dataStatus: 'current',
      sources: [
        { id: 'DEV-2024-0142', title: 'HVAC Temperature Excursion - Bldg B', type: 'Deviation', status: 'approved', department: 'Manufacturing', traceabilityId: 'TR-DEV-142' },
        { id: 'DEV-2024-0089', title: 'Filter Replacement Delay Impact', type: 'Deviation', status: 'approved', department: 'Facilities', traceabilityId: 'TR-DEV-089' },
        { id: 'CAPA-2024-0034', title: 'HVAC Monitoring Enhancement', type: 'CAPA', status: 'draft', department: 'Quality', traceabilityId: 'TR-CAPA-034' },
        { id: 'SOP-ENV-003', title: 'Environmental Monitoring Procedure', type: 'SOP', version: 'v4.2', status: 'approved', department: 'Quality', traceabilityId: 'TR-SOP-ENV003' }
      ],
      sensitivityLevel: 'medium',
      regulatorySensitive: true,
      partialAccess: false
    }
  ],
  qc: [
    {
      id: 'resp-qc-001',
      timestamp: new Date().toISOString(),
      query: 'Any historical OOS for Product X, Test Y?',
      summary: `Three historical OOS events were recorded for Product X (Test Y) in the past 24 months. Two were confirmed laboratory errors and closed. One remains open pending additional stability data.`,
      confidence: 'medium',
      confidenceScore: 78,
      dataStatus: 'current',
      sources: [
        { id: 'OOS-2024-0034', title: 'Dissolution Failure - Product X Batch 2024-091', type: 'OOS', status: 'approved', department: 'QC Lab', traceabilityId: 'TR-OOS-034' },
        { id: 'OOT-2024-0089', title: 'Assay Trending - Product X Stability', type: 'OOT', status: 'approved', department: 'Stability', traceabilityId: 'TR-OOT-089' }
      ],
      sensitivityLevel: 'medium',
      regulatorySensitive: true,
      partialAccess: false
    }
  ],
  production: [
    {
      id: 'resp-prod-001',
      timestamp: new Date().toISOString(),
      query: 'Equipment maintenance due this week',
      summary: `Two equipment items are due for preventive maintenance this week: Fluid Bed Dryer (PM due Jan 19) and Blender Line 2 (PM due Jan 21). No critical impact is expected with scheduled downtime.`,
      confidence: 'high',
      confidenceScore: 88,
      dataStatus: 'current',
      sources: [
        { id: 'EQ-2024-0089', title: 'Fluid Bed Dryer - PM Due', type: 'Equipment', status: 'approved', department: 'Maintenance', traceabilityId: 'TR-EQ-089' },
        { id: 'EQ-2024-0093', title: 'Blender Line 2 - PM Schedule', type: 'Equipment', status: 'approved', department: 'Maintenance', traceabilityId: 'TR-EQ-093' }
      ],
      sensitivityLevel: 'low',
      regulatorySensitive: false,
      partialAccess: false
    }
  ],
  regulatory: [
    {
      id: 'resp-reg-001',
      timestamp: new Date().toISOString(),
      query: 'All deviations cited in last USFDA inspection',
      summary: `The last USFDA inspection cited 4 deviations: documentation control gaps, environmental monitoring trend review delays, CAPA closure timeliness, and training record completeness. Two items have been fully closed; two are under remediation with timelines submitted.`,
      confidence: 'high',
      confidenceScore: 85,
      dataStatus: 'current',
      sources: [
        { id: 'INS-2024-0005', title: 'USFDA Inspection 2024 - Observation Summary', type: 'Inspection', status: 'approved', department: 'Regulatory', traceabilityId: 'TR-INS-005' },
        { id: 'CAPA-2024-0120', title: 'CAPA for Documentation Controls', type: 'CAPA', status: 'approved', department: 'Quality', traceabilityId: 'TR-CAPA-120' }
      ],
      sensitivityLevel: 'high',
      regulatorySensitive: true,
      partialAccess: false
    }
  ],
  sales: [
    {
      id: 'resp-sales-001',
      timestamp: new Date().toISOString(),
      query: 'Client compliance requirements summary',
      summary: `Top client compliance requirements include: audit readiness documentation within 5 business days, batch traceability reports, and change control notification within 10 days. All current products meet baseline requirements; two products require updated stability data packages for EU submissions.`,
      confidence: 'medium',
      confidenceScore: 74,
      dataStatus: 'current',
      sources: [
        { id: 'RFP-2024-0089', title: 'Client RFP Requirements - GlobalPharma', type: 'RFP', status: 'approved', department: 'Sales', traceabilityId: 'TR-RFP-089' },
        { id: 'DOC-REG-014', title: 'EU Stability Data Package', type: 'Document', status: 'approved', department: 'Regulatory', traceabilityId: 'TR-DOC-014' }
      ],
      sensitivityLevel: 'medium',
      regulatorySensitive: false,
      partialAccess: false
    }
  ],
  management: [
    {
      id: 'resp-mgmt-001',
      timestamp: new Date().toISOString(),
      query: 'Compliance risk overview this quarter',
      summary: `Compliance risk remains moderate with two elevated areas: CAPA closure timelines and training completion for new hires. Overall compliance index improved from 88% to 91% QoQ.`,
      confidence: 'high',
      confidenceScore: 90,
      dataStatus: 'current',
      sources: [
        { id: 'RISK-001', title: 'Q4 Compliance Risk Review', type: 'Risk', status: 'approved', department: 'Quality', traceabilityId: 'TR-RISK-001' },
        { id: 'COMP-001', title: 'Training Compliance Summary', type: 'Compliance', status: 'approved', department: 'HR', traceabilityId: 'TR-COMP-001' }
      ],
      sensitivityLevel: 'medium',
      regulatorySensitive: true,
      partialAccess: false
    }
  ],
  admin: [
    {
      id: 'resp-admin-001',
      timestamp: new Date().toISOString(),
      query: 'System health status',
      summary: `System health is stable. API uptime at 99.8% over the last 30 days. One pending maintenance window scheduled for Jan 21, 2026.`,
      confidence: 'high',
      confidenceScore: 93,
      dataStatus: 'current',
      sources: [
        { id: 'SYS-2024-0089', title: 'Database Maintenance Window', type: 'System', status: 'approved', department: 'IT', traceabilityId: 'TR-SYS-089' },
        { id: 'LOG-2024-122', title: 'Service Uptime Report', type: 'Log', status: 'approved', department: 'IT', traceabilityId: 'TR-LOG-122' }
      ],
      sensitivityLevel: 'low',
      regulatorySensitive: false,
      partialAccess: false
    }
  ]
};

export function QueryInterface() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  if (!user) return null;

  const roleConfig = ROLE_CONFIGS[user.role];
  const suggestedQueries = SAMPLE_QUERIES[user.role] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    // NOTE: Backend API calls are intentionally disabled until the query service is ready.
    // const apiResponse = await apiClient.executeQuery(query);
    // TODO: Replace dummy response with real API response when backend integration is complete.

    const roleResponses = SAMPLE_RESPONSES[user.role] || [];
    const suggestedIndex = suggestedQueries.findIndex((suggestion) => suggestion === query);
    const fallbackResponse = roleResponses[0];
    const baseResponse = roleResponses[suggestedIndex] || fallbackResponse;

    if (baseResponse) {
      setResponse({
        ...baseResponse,
        id: `resp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query,
      });
    } else {
      setResponse({
        id: `resp-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query,
        summary: 'No dummy response is configured for this role yet.',
        confidence: 'low',
        confidenceScore: 0,
        dataStatus: 'current',
        sources: [],
        sensitivityLevel: 'medium',
        regulatorySensitive: false,
        partialAccess: false
      });
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Query input area */}
      <div className="p-6 border-b border-border bg-card">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ask a question about your accessible data..."
              className="w-full h-14 pl-12 pr-24 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-base"
            />
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Query
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Suggested queries */}
        {showSuggestions && !response && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggested queries for {roleConfig.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 rounded-full border border-border bg-background text-sm text-foreground hover:bg-accent hover:border-primary/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing data sources...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Applying role-based access filters</p>
            </div>
          </div>
        )}

        {response && !isLoading && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
            {/* Response header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Query</p>
                <p className="text-lg font-medium text-foreground">{response.query}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge variant={response.dataStatus === 'current' ? 'approved' : 'warning'}>
                  {response.dataStatus === 'current' ? 'Current Data' : 'Stale Data'}
                </StatusBadge>
                {response.regulatorySensitive && (
                  <StatusBadge variant="info">
                    <Shield className="w-3 h-3 mr-1" />
                    Regulatory Sensitive
                  </StatusBadge>
                )}
              </div>
            </div>

            {/* Answer card */}
            <div className={cn(
              'bg-card rounded-xl border border-border p-6',
              response.sensitivityLevel === 'high' && 'sensitivity-high',
              response.sensitivityLevel === 'medium' && 'sensitivity-medium'
            )}>
              {/* Confidence indicator */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <ConfidenceIndicator
                    level={response.confidence}
                    score={response.confidenceScore}
                  />
                </div>
                <span className="timestamp">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(response.timestamp).toLocaleString()}
                </span>
              </div>

              {/* Summary */}
              <div className="prose prose-sm max-w-none text-foreground">
                <div className="whitespace-pre-line">{response.summary}</div>
              </div>

              {/* Access justification if partial */}
              {response.partialAccess && response.accessJustification && (
                <div className="mt-4 p-3 rounded-lg bg-status-warning-bg border border-status-warning/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-status-warning">Partial Access</p>
                      <p className="text-sm text-status-warning/80">{response.accessJustification}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Source documents */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Source Documents ({response.sources.length})
                </h3>
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View All
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {response.sources.map((source) => (
                  <SourceDocumentRow key={source.id} source={source} />
                ))}
              </div>
            </div>

            {/* Audit footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
              <span>Query ID: {response.id}</span>
              <span>User: {user.name} ({user.role.toUpperCase()})</span>
              <span>Logged for compliance audit</span>
            </div>
          </div>
        )}

        {!response && !isLoading && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Query the Knowledge Base</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask questions about your accessible documents. Results are filtered based on your {roleConfig.fullName} access scope.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceDocumentRow({ source }: { source: SourceDocument }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs text-muted-foreground">{source.id}</span>
          <StatusBadge variant={source.status === 'approved' ? 'approved' : 'draft'} size="sm">
            {source.status}
          </StatusBadge>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{source.title}</p>
        <p className="text-xs text-muted-foreground">{source.department} • {source.type}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {source.version && (
          <span className="text-xs text-muted-foreground">{source.version}</span>
        )}
        <p className="text-xs font-mono text-muted-foreground/60">{source.traceabilityId}</p>
      </div>
    </div>
  );
}
