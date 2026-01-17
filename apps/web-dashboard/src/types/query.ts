export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DataStatus = 'current' | 'stale' | 'partial';
export type SensitivityLevel = 'high' | 'medium' | 'low';
export type DocumentStatus = 'approved' | 'draft' | 'archived' | 'superseded';

export interface SourceDocument {
  id: string;
  title: string;
  type: 'SOP' | 'Deviation' | 'CAPA' | 'BMR' | 'Audit' | 'Submission' | 'Report' | 'Correspondence';
  version?: string;
  status: DocumentStatus;
  effectiveDate?: string;
  department: string;
  traceabilityId: string;
}

export interface QueryResponse {
  id: string;
  timestamp: string;
  query: string;
  summary: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  dataStatus: DataStatus;
  sources: SourceDocument[];
  accessJustification?: string;
  sensitivityLevel: SensitivityLevel;
  regulatorySensitive: boolean;
  restrictedContent?: string[];
  partialAccess: boolean;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  responsePreview: string;
  confidence: ConfidenceLevel;
}
