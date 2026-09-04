/**
 * PhishGuard - Frontend API type definitions.
 * Mirrors the backend Pydantic schemas (backend/app/schemas).
 * The backend remains the source of truth; keep these in sync.
 */

/* ---------- URL Analysis ---------- */

export interface AnalyzeURLRequest {
  url: string;
}

export interface ProviderStatus {
  provider: string;
  status: string; // success | no_match | unavailable | rate_limited | error
  matched: boolean;
  severity: string | null;
  message: string;
  details: Record<string, unknown> | null;
}

export interface EvidenceItem {
  title: string;
  category: string;
  description: string;
  risk_level: string; // low | medium | high | critical
}

export interface AnalyzeURLResponse {
  id: string;
  url: string;
  normalized_url: string;
  domain: string;
  classification: string; // SAFE | SUSPICIOUS | PHISHING
  risk_score: number; // 0-100
  ml_probability: number; // 0.0-1.0
  providers: Record<string, ProviderStatus>;
  evidence: EvidenceItem[];
  reasons: string[];
  recommendations: string[];
  url_features: Record<string, number | string>;
  analyzed_at: string;
}

/* ---------- Simulator ---------- */

export interface SimulatorSessionCreate {
  target_email: string;
}

export interface SimulatorSessionResponse {
  session_id: string;
  target_email: string;
  status: string;
  created_at: string;
}

export interface SimulatorEventCreate {
  session_id: string;
  event_type: string;
  username_entered?: string | null;
  password_entered: boolean;
  password_value?: string | null;  // The actual typed password — returned for educational display, never persisted.
}

export interface SimulatorEventResponse {
  id: string;
  session_id: string;
  event_type: string;
  username_entered: string | null;
  password_entered: boolean;
  password_value: string | null;
  timestamp: string;
}

export interface LatestSimulatorEvent {
  id: string;
  session_id: string;
  target_email: string;
  event_type: string;
  username_entered: string | null;
  password_entered: boolean;
  session_status: string;
  timestamp: string;
}

export interface LatestSimulatorEventResponse {
  has_events: boolean;
  message?: string;
  latest_event: LatestSimulatorEvent | null;
}

export interface SimulatorResetResponse {
  status: string;
  message: string;
}
