"""Screening/symptom monitoring routes.

Real, deterministic logic — not an AI model. Screening status comes from
app/models/screening_rules.py::get_screening_status (age + last screening
date), and symptom red-flagging from the same module's evaluate_symptom
(keyword match against RED_FLAG_SYMPTOMS). Both are explicitly flagged
PLACEHOLDER / not-clinically-validated thresholds in that module — this
router just wires them up; it doesn't add new clinical judgment.

Access rules (CLAUDE.md):
  - /monitoring/clinic/*                  -> clinician/admin only
  - /monitoring/patients/{patient_id}/*   -> clinician/admin, or the patient themselves
"""
from __future__ import annotations

from collections import Counter
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.audit import record_audit
from app.consent import record_consent, sync_consent_flag, withdraw_active_consent
from app.db.database import get_db
from app.deps import (
    get_current_admin,
    get_current_clinician,
    get_current_user,
    verify_patient_access,
)
from app.models.patient import Patient
from app.models.risk_assessment import RiskAssessment
from app.models.screening_rules import (
    DUE_SOON_WINDOW_DAYS,
    MAX_ELIGIBLE_AGE,
    MIN_ELIGIBLE_AGE,
    SCREENING_INTERVAL_DAYS,
    age_years,
    evaluate_symptom,
    get_screening_status,
)
from app.models.symptom import SymptomEntry
from app.models.user import User
from app.retention import erase_patient_data
from app.schemas.audit import ConsentCreateRequest
from app.schemas.monitoring import SymptomCreateRequest


def _get_patient_or_404(db: Session, patient_id: int) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient

# --- Clinic-only ---
clinic_router = APIRouter(
    prefix="/monitoring/clinic",
    tags=["monitoring:clinic"],
    dependencies=[Depends(get_current_clinician)],
)


@clinic_router.get("/overview")
def clinic_overview(db: Session = Depends(get_db)) -> dict:
    """Real aggregate counts — no fabricated numbers, no AI inference."""
    patients = db.query(Patient).all()
    screening_counts = Counter(
        get_screening_status(p.birth_date, p.last_screening_date) for p in patients
    )
    consented = sum(1 for p in patients if p.consent_given)

    triage_counts = Counter(
        label for (label,) in db.query(RiskAssessment.triage_label).all()
    )
    active_red_flags = (
        db.query(SymptomEntry).filter(SymptomEntry.is_red_flag.is_(True)).count()
    )

    return {
        "total_patients": len(patients),
        "consented_patients": consented,
        "by_screening_status": dict(screening_counts),
        "by_triage_label": dict(triage_counts),
        "active_red_flag_symptoms": active_red_flags,
    }


# --- Per-patient, ownership-checked (router-level dep reads {patient_id}) ---
patient_router = APIRouter(
    prefix="/monitoring/patients/{patient_id}",
    tags=["monitoring:patient"],
    dependencies=[Depends(verify_patient_access)],
)


@patient_router.get("")
def patient_card(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    patient = _get_patient_or_404(db, patient_id)
    # Audit: who viewed this patient's card (e.g. a clinician opening the record).
    record_audit(db, current_user, "view_patient_card", "patient", patient_id)
    return {
        "patient_id": patient_id,
        "full_name": patient.full_name,
        "age": age_years(patient.birth_date) if patient.birth_date else None,
        "screening_status": get_screening_status(patient.birth_date, patient.last_screening_date),
        "consent_given": bool(patient.consent_given),
    }


@patient_router.get("/symptoms")
def patient_symptoms(patient_id: int, db: Session = Depends(get_db)) -> dict:
    entries = (
        db.query(SymptomEntry)
        .filter(SymptomEntry.patient_id == patient_id)
        .order_by(SymptomEntry.reported_at.desc())
        .all()
    )
    return {
        "patient_id": patient_id,
        "symptoms": [
            {
                "id": e.id,
                "symptom_text": e.symptom_text,
                "is_red_flag": e.is_red_flag,
                "reported_at": e.reported_at.isoformat() if e.reported_at else None,
            }
            for e in entries
        ],
    }


@patient_router.post("/symptoms")
def log_symptom(
    patient_id: int,
    payload: SymptomCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Log one symptom-diary entry. Red-flagging is a deterministic keyword
    match (app/models/screening_rules.py::evaluate_symptom) — never an AI
    guess, and a red flag always recommends a doctor regardless of anything
    else (CLAUDE.md invariant)."""
    _get_patient_or_404(db, patient_id)
    verdict = evaluate_symptom(payload.symptom_text)

    entry = SymptomEntry(
        patient_id=patient_id,
        symptom_text=payload.symptom_text,
        is_red_flag=verdict["is_red_flag"],
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    record_audit(
        db, current_user, "symptom.logged", "patient", patient_id,
        details={"symptom_entry_id": entry.id, "is_red_flag": entry.is_red_flag},
    )

    return {
        "id": entry.id,
        "symptom_text": entry.symptom_text,
        "is_red_flag": entry.is_red_flag,
        "recommendation": verdict["recommendation"],
        "reported_at": entry.reported_at.isoformat() if entry.reported_at else None,
    }


@patient_router.get("/schedule")
def patient_schedule(patient_id: int, db: Session = Depends(get_db)) -> dict:
    patient = _get_patient_or_404(db, patient_id)
    next_due = (
        (patient.last_screening_date + timedelta(days=SCREENING_INTERVAL_DAYS)).isoformat()
        if patient.last_screening_date
        else None
    )
    return {
        "patient_id": patient_id,
        "screening_status": get_screening_status(patient.birth_date, patient.last_screening_date),
        "last_screening_date": (
            patient.last_screening_date.isoformat() if patient.last_screening_date else None
        ),
        "next_due_date": next_due,
        # PLACEHOLDER thresholds (not clinically validated) — surfaced for
        # transparency, see app/models/screening_rules.py.
        "min_eligible_age": MIN_ELIGIBLE_AGE,
        "max_eligible_age": MAX_ELIGIBLE_AGE,
        "screening_interval_days": SCREENING_INTERVAL_DAYS,
        "due_soon_window_days": DUE_SOON_WINDOW_DAYS,
    }


@patient_router.post("/consent")
def give_consent(
    patient_id: int,
    consent: ConsentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Record a new consent against an explicitly-passed text version + snapshot."""
    patient = _get_patient_or_404(db, patient_id)
    record = record_consent(
        db, patient_id, consent.consent_text_version, consent.consent_text_snapshot
    )
    sync_consent_flag(db, patient)  # -> consent_given becomes True
    record_id, given_at = record.id, record.given_at
    record_audit(
        db, current_user, "consent.given", "patient", patient_id,
        details={"consent_record_id": record_id, "version": consent.consent_text_version},
    )
    return {
        "patient_id": patient_id,
        "consent_record_id": record_id,
        "consent_text_version": consent.consent_text_version,
        "consent_given": True,
        "given_at": given_at.isoformat(),
    }


@patient_router.post("/consent/withdraw")
def withdraw_consent(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Withdraw active consent. Flips consent_given to False and blocks AI upload."""
    patient = _get_patient_or_404(db, patient_id)
    withdrawn = withdraw_active_consent(db, patient_id)
    sync_consent_flag(db, patient)  # -> consent_given becomes False
    record_audit(
        db, current_user, "consent.withdrawn", "patient", patient_id,
        details={"withdrawn_count": withdrawn},
    )
    return {"patient_id": patient_id, "consent_given": False, "withdrawn": withdrawn}


@patient_router.delete("/data")
def erase_patient_data_endpoint(
    patient_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Right-to-be-forgotten: erase images + personal fields for one patient.

    Admin-only (irreversible — the router-level verify_patient_access dep
    would otherwise also let the patient herself trigger this; we deliberately
    require get_current_admin on top, see README "Путь к пилоту").
    """
    patient = _get_patient_or_404(db, patient_id)
    summary = erase_patient_data(db, patient)
    record_audit(db, current_user, "erase_patient_data", "patient", patient_id, details=summary)
    return {"patient_id": patient_id, **summary}
