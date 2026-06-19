// Mock network layer. Every function looks and behaves like an async fetch to
// a real API (awaitable, artificial latency, returns plain JSON-like objects),
// but is served entirely from an in-memory store seeded from data/fixtures.ts.
//
// Swapping this for the real backend later = replace these function bodies with
// fetch() calls; the screens calling them don't change. NOTHING here is a stub:
// adding a symptom, uploading an image, booking an appointment, and a clinician
// review all mutate the store and persist for the rest of the session.
import {
  appointments as seedAppointments,
  assessments as seedAssessments,
  DATASET_STATUS,
  DISCLAIMER,
  MODEL_STATUS,
  MODEL_VERSION,
  patients as seedPatients,
  RED_FLAG_PHRASES,
  symptoms as seedSymptoms,
  TRIAGE_PATIENT_MESSAGE,
} from "../data/fixtures";
import type {
  Appointment,
  Patient,
  RiskAssessment,
  Role,
  SymptomEntry,
  TriageLabel,
  UploadResult,
} from "./types";

// --- in-memory store (mutable copies so demo actions persist this session) ---
const db = {
  patients: structuredClone(seedPatients) as Patient[],
  symptoms: structuredClone(seedSymptoms) as SymptomEntry[],
  assessments: structuredClone(seedAssessments) as RiskAssessment[],
  appointments: structuredClone(seedAppointments) as Appointment[],
};

let nextId = 1000;
const newId = () => ++nextId;

// Simulate a "live" network round-trip so skeletons/spinners are visible.
function delay<T>(value: T, ms = 300 + Math.random() * 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

function recommendationFor(isRedFlag: boolean): string {
  return isRedFlag ? "обратитесь к врачу" : "наблюдать, плановый скрининг по графику";
}

// --- auth (mock — no JWT, just a role) ---
export const mockApi = {
  async login(role: Role): Promise<{ role: Role }> {
    return delay({ role }, 400);
  },

  // --- patient-facing ---
  async getPatient(id: number): Promise<Patient | null> {
    return delay(db.patients.find((p) => p.id === id) ?? null);
  },

  async getSymptoms(patientId: number): Promise<SymptomEntry[]> {
    const list = db.symptoms
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
    return delay(list);
  },

  async addSymptom(patientId: number, text: string): Promise<SymptomEntry> {
    const lowered = text.toLowerCase();
    const isRedFlag = RED_FLAG_PHRASES.some((p) => lowered.includes(p.toLowerCase()));
    const entry: SymptomEntry = {
      id: newId(),
      patientId,
      text,
      isRedFlag,
      reportedAt: new Date().toISOString(),
      recommendation: recommendationFor(isRedFlag),
    };
    db.symptoms.push(entry);
    return delay(entry);
  },

  async getAppointments(patientId: number): Promise<Appointment[]> {
    const list = db.appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.datetime.localeCompare(a.datetime));
    return delay(list);
  },

  async bookAppointment(
    patientId: number,
    input: { datetime: string; reason: string },
  ): Promise<Appointment> {
    const appt: Appointment = {
      id: newId(),
      patientId,
      datetime: input.datetime,
      doctorName: "Врач Сауле Жаксыбекова",
      location: "Городская поликлиника №7, каб. 312",
      reason: input.reason,
      status: "upcoming",
    };
    db.appointments.push(appt);
    return delay(appt);
  },

  // Patient upload -> AI triage result. Returns ONLY patient-safe fields (no
  // rawScore/confidence). Also files a real assessment row so the clinician
  // cabinet sees the same upload in its queue (cross-cabinet continuity).
  async uploadImage(patientId: number, fileName: string): Promise<UploadResult> {
    const patient = db.patients.find((p) => p.id === patientId);
    // Demo triage outcome — rotates so repeated demos show variety; never an
    // "all clear / no doctor needed" message.
    const rotation: TriageLabel[] = ["ROUTINE_FOLLOWUP", "PRIORITY_REVIEW", "PENDING_REVIEW"];
    const triageLabel = rotation[db.assessments.length % rotation.length];

    db.assessments.unshift({
      id: newId(),
      patientId,
      patientName: patient?.fullName ?? `Пациентка #${patientId}`,
      createdAt: new Date().toISOString(),
      triageLabel,
      imageName: fileName,
      patientFacingMessage: TRIAGE_PATIENT_MESSAGE[triageLabel],
      rawScore: triageLabel === "PENDING_REVIEW" ? null : Math.round(Math.random() * 60 + 20) / 100,
      confidence: Math.round((Math.random() * 0.3 + 0.6) * 100) / 100,
      modelVersion: MODEL_VERSION,
      modelStatus: MODEL_STATUS,
      datasetStatus: DATASET_STATUS,
      clinicianDecision: null,
    });

    return delay({
      triageLabel,
      patientFacingMessage: TRIAGE_PATIENT_MESSAGE[triageLabel],
      disclaimer: DISCLAIMER,
      modelStatus: MODEL_STATUS,
    });
  },

  // --- clinician-facing ---
  async getClinicOverview(): Promise<{
    totalPatients: number;
    pendingReview: number;
    urgent: number;
    redFlags: number;
  }> {
    return delay({
      totalPatients: db.patients.length,
      pendingReview: db.assessments.filter((a) => a.triageLabel === "PENDING_REVIEW").length,
      urgent: db.assessments.filter((a) => a.triageLabel === "URGENT_REVIEW").length,
      redFlags: db.symptoms.filter((s) => s.isRedFlag).length,
    });
  },

  async getQueue(): Promise<RiskAssessment[]> {
    const list = [...db.assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(list);
  },

  async getPatients(): Promise<Patient[]> {
    return delay(db.patients);
  },

  async getAssessment(id: number): Promise<RiskAssessment | null> {
    return delay(db.assessments.find((a) => a.id === id) ?? null);
  },

  async submitReview(
    assessmentId: number,
    decision: string,
    note: string,
  ): Promise<RiskAssessment> {
    const a = db.assessments.find((x) => x.id === assessmentId);
    if (!a) throw new Error("assessment not found");
    a.clinicianDecision = note ? `${decision}: ${note}` : decision;
    return delay(a);
  },

  async getPatientSymptoms(patientId: number): Promise<SymptomEntry[]> {
    return this.getSymptoms(patientId);
  },
};

export { DISCLAIMER };
