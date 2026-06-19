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
// mirrors app/models/risk_assessment.py::RiskAssessment; real DB rows).
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
  items: QueueItem[];
}

export interface ReviewRequest {
  decision: string;
  patient_id?: number;
  note?: string;
}

export interface ReviewResponse {
  assessment_id: number;
  decision: string;
  clinician_decision: string;
}

export interface ConsentResponse {
  patient_id: number;
  consent_record_id?: number;
  consent_text_version?: string;
  consent_given: boolean;
  given_at?: string;
  withdrawn?: number;
}

// GET/POST /monitoring/patients/{id}/symptoms
export interface SymptomEntry {
  id: number;
  symptom_text: string;
  is_red_flag: boolean;
  reported_at: string;
}

export interface SymptomsResponse {
  patient_id: number;
  symptoms: SymptomEntry[];
}

export interface LogSymptomResponse extends SymptomEntry {
  recommendation: string;
}

// GET /monitoring/patients/{id}/schedule
export interface ScheduleResponse {
  patient_id: number;
  screening_status: string;
  last_screening_date: string | null;
  next_due_date: string | null;
  min_eligible_age: number;
  max_eligible_age: number;
  screening_interval_days: number;
  due_soon_window_days: number;
}

// GET /monitoring/clinic/overview (clinician/admin-only)
export interface ClinicOverviewResponse {
  total_patients: number;
  consented_patients: number;
  by_screening_status: Record<string, number>;
  by_triage_label: Record<string, number>;
  active_red_flag_symptoms: number;
}
