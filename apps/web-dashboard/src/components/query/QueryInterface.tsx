import { useState } from 'react';
import { Search, Send, Sparkles, Clock, FileText, AlertTriangle, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfidenceIndicator } from '@/components/ui/ConfidenceIndicator';
import { QueryResponse, SourceDocument, QueryHistoryItem } from '@/types/query';
import { ROLE_CONFIGS } from '@/types/roles';
import apiClient from '@/lib/apiClient';

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

const SAMPLE_RESPONSE: QueryResponse = {
  id: 'resp-001',
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

    try {
      // Call backend API
      const apiResponse = await apiClient.executeQuery(query);
      
      // Transform API response to match frontend QueryResponse type
      setResponse({
        id: `resp-${Date.now()}`,
        timestamp: apiResponse.timestamp,
        query,
        summary: apiResponse.answer,
        confidence: apiResponse.confidence >= 0.8 ? 'high' : apiResponse.confidence >= 0.5 ? 'medium' : 'low',
        confidenceScore: Math.round(apiResponse.confidence * 100),
        dataStatus: 'current',
        sources: apiResponse.sources.map((src: any, idx: number) => ({
          id: `src-${idx}`,
          title: src.title,
          type: src.type || 'Document',
          status: 'approved',
          department: user?.department || 'Unknown',
          traceabilityId: `TR-${idx}`
        })),
        sensitivityLevel: 'medium',
        regulatorySensitive: false,
        partialAccess: false
      });
    } catch (error) {
      console.error('Query failed:', error);
      // Show error message to user
      setResponse({
        id: `resp-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query,
        summary: 'Sorry, there was an error processing your query. Please try again.',
        confidence: 'low',
        confidenceScore: 0,
        dataStatus: 'current',
        sources: [],
        sensitivityLevel: 'medium',
        regulatorySensitive: false,
        partialAccess: false
      });
    } finally {
      setIsLoading(false);
    }
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
