// Shared types for the demo. These mirror the *meaning* of the real backend
// models (see backend/app/models/*) so swapping mockApi.ts for real calls
// later is a data-shape match, not a rewrite.

export type Role = "patient" | "clinician";

// app/models/screening_rules.py
export type ScreeningStatus =
  | "NOT_YET_ELIGIBLE"
  | "OUT_OF_PROGRAM_AGE"
  | "OVERDUE"
  | "DUE_SOON"
  | "UP_TO_DATE";

// app/models/risk_assessment.py::TRIAGE_LABELS (+ PENDING_REVIEW)
export type TriageLabel =
  | "INSUFFICIENT_QUALITY"
  | "PENDING_REVIEW"
  | "ROUTINE_FOLLOWUP"
  | "PRIORITY_REVIEW"
  | "URGENT_REVIEW";

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Patient {
  id: number;
  fullName: string;
  birthDate: string; // ISO date
  age: number;
  screeningStatus: ScreeningStatus;
  lastScreeningDate: string | null;
  nextDueDate: string | null;
  consentGiven: boolean;
}

export interface SymptomEntry {
  id: number;
  patientId: number;
  text: string;
  isRedFlag: boolean;
  reportedAt: string; // ISO datetime
  recommendation: string;
}

export interface RiskAssessment {
  id: number;
  patientId: number;
  patientName: string;
  createdAt: string; // ISO datetime
  triageLabel: TriageLabel;
  imageName: string;
  patientFacingMessage: string;
  // Clinician-only — never shown on patient screens (CLAUDE.md invariant).
  rawScore: number | null;
  confidence: number | null;
  modelVersion: string;
  modelStatus: string;
  datasetStatus: string;
  clinicianDecision: string | null;
}

export interface Appointment {
  id: number;
  patientId: number;
  datetime: string; // ISO datetime
  doctorName: string;
  location: string;
  reason: string;
  status: AppointmentStatus;
}

// The patient-facing upload response. Deliberately carries NO rawScore /
// confidence — those are clinician-only (CLAUDE.md).
export interface UploadResult {
  triageLabel: TriageLabel;
  patientFacingMessage: string;
  disclaimer: string;
  modelStatus: string;
}
