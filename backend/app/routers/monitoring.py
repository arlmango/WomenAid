"""Screening/symptom monitoring routes.

ENDPOINTS ARE STUBS — monitoring business logic is not implemented here. This
module wires up access control and audit logging (patient-card views, consent
changes), plus placeholder responses.

Access rules (CLAUDE.md):
  - /monitoring/clinic/*                  -> clinician/admin only
  - /monitoring/patients/{patient_id}/*   -> clinician/admin, or the patient themselves
"""
from __future__ import annotations

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
from app.models.user import User
from app.retention import erase_patient_data
from app.schemas.audit import ConsentCreateRequest


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
def clinic_overview() -> dict:
    return {"stub": True, "detail": "clinic monitoring overview not implemented"}


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
    # Audit: who viewed this patient's card (e.g. a clinician opening the record).
    record_audit(db, current_user, "view_patient_card", "patient", patient_id)
    # STUB.
    return {"stub": True, "patient_id": patient_id, "detail": "patient card not implemented"}


@patient_router.get("/symptoms")
def patient_symptoms(patient_id: int) -> dict:
    return {
        "stub": True,
        "patient_id": patient_id,
        "detail": "symptom monitoring not implemented",
        "symptoms": [],
    }


@patient_router.get("/schedule")
def patient_schedule(patient_id: int) -> dict:
    return {
        "stub": True,
        "patient_id": patient_id,
        "detail": "screening schedule not implemented",
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
