// TS mirrors of backend response shapes (see backend/app/schemas, backend/app/models).
// Kept intentionally small — only fields the UI actually reads.

export type Role = "patient" | "clinician" | "admin" | "system";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface JwtClaims {
  sub: string;
  role: Role;
  patient_id?: number | null;
  exp: number;
}

// POST /risk-assessment/upload/{patient_id} response.
// Deliberately has NO raw_score/confidence field — the backend never sends
// them here, and this type must stay that way (see CLAUDE.md).
export interface UploadResult {
  patient_id: number;
  triage_label: string;
  patient_facing_message: string;
  disclaimer: string;
}

// One row of GET /risk-assessment/clinic/queue's `items` (clinician-only —
// shape mirrors app/models/risk_assessment.py::RiskAssessment). The current
// backend stub always returns an empty array; this type is what a filled-in
// implementation would emit.
export interface QueueItem {
  id: number;
  patient_id: number;
  patient_name?: string | null;
  created_at: string;
  triage_label: string;
  raw_score: number | null;
  confidence: number | null;
  model_version: string | null;
  model_status: string;
  dataset_status: string;
  clinician_decision?: string | null;
}

export interface QueueResponse {
  stub?: boolean;
  detail?: string;
  items: QueueItem[];
}

export interface ReviewRequest {
  decision: string;
  patient_id?: number;
  note?: string;
}

export interface ReviewResponse {
  stub?: boolean;
  detail?: string;
  assessment_id: number;
  decision: string;
}

export interface StubResponse {
  stub?: boolean;
  detail?: string;
  [key: string]: unknown;
}

export interface ConsentResponse {
  patient_id: number;
  consent_record_id?: number;
  consent_text_version?: string;
  consent_given: boolean;
  given_at?: string;
  withdrawn?: number;
}
