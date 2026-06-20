// Mirrors backend response/request shapes (see backend/app/schemas,
// backend/app/models). Kept minimal — only fields the UI reads.

export type Role = "patient" | "clinician" | "admin" | "system";

export interface JwtClaims {
  sub: string;
  role: Role;
  patient_id?: number | null;
  exp: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ConsentTextResponse {
  version: string;
  text: string;
}

export interface RegisterPayload {
  display_name: string;
  birth_date: string; // ISO date (YYYY-MM-DD)
  phone?: string;
  region?: string;
  username: string;
  password: string;
  consent: boolean;
}

// GET /monitoring/patients/{id}/schedule — real, deterministic (age + last
// screening date), never an AI guess. See backend/app/models/screening_rules.py.
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

// GET/POST /monitoring/patients/{id}/symptoms — real; red-flag is a
// deterministic keyword match, never an AI guess.
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
