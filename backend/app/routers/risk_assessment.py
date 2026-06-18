"""Risk-assessment routes.

ENDPOINTS ARE STUBS — the triage business logic is NOT implemented here. Per
CLAUDE.md, triage / red-flag / patient-facing safety messages are a stop-signal
and must be authored with the clinical team. This module wires up the *access
control* and *audit logging* the data-protection task requires, plus
placeholder responses.

Access rules (CLAUDE.md):
  - /risk-assessment/clinic/*           -> clinician/admin only
  - /risk-assessment/upload/{patient_id}-> clinician/admin, or the patient themselves
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.audit import record_audit
from app.consent import require_active_consent
from app.db.database import get_db
from app.deps import get_current_clinician, verify_patient_access
from app.encryption import FileEncryptionNotConfigured
from app.models.patient import Patient
from app.models.risk_assessment import (
    DATASET_STATUS_NO_INFERENCE,
    MODEL_STATUS_NOT_VALIDATED,
    RiskAssessment,
)
from app.models.screening_rules import age_years
from app.models.user import User
from app.pdf_report import build_assessment_report_pdf
from app.retention import extend_retention
from app.schemas.audit import ReviewRequest
from app.storage import save_encrypted_upload

# Disclaimer shown to patients; the real text belongs in app/ml/inference.py.
_DISCLAIMER = (
    "Это вспомогательная информация для маршрутизации (decision-support), "
    "а не медицинский диагноз. Модель не прошла клиническую валидацию. "
    "Окончательное решение принимает врач."
)

# --- Clinic-only: full triage queue (WITH scores) is clinician/admin only ---
clinic_router = APIRouter(
    prefix="/risk-assessment/clinic",
    tags=["risk-assessment:clinic"],
    dependencies=[Depends(get_current_clinician)],
)


@clinic_router.get("/queue")
def clinic_queue(
    current_user: User = Depends(get_current_clinician),
    db: Session = Depends(get_db),
) -> dict:
    # Audit: who opened the triage queue.
    record_audit(db, current_user, "view_clinic_queue", "risk_assessment", None)
    # STUB. Real queue would include raw_score/confidence — clinician-only by design.
    return {"stub": True, "detail": "clinic triage queue not implemented", "items": []}


@clinic_router.post("/review/{assessment_id}")
def review_assessment(
    assessment_id: int,
    review: ReviewRequest,
    current_user: User = Depends(get_current_clinician),
    db: Session = Depends(get_db),
) -> dict:
    # STUB: no assessment records exist yet, so nothing is mutated. The clinician's
    # review *decision* (their input — not an AI output) is recorded for audit.
    record_audit(
        db,
        current_user,
        "review_assessment",
        "risk_assessment",
        assessment_id,
        details={
            "decision": review.decision,
            "patient_id": review.patient_id,
            "note": review.note,
        },
    )
    return {
        "stub": True,
        "detail": "assessment review recorded (audit only; review logic not implemented)",
        "assessment_id": assessment_id,
        "decision": review.decision,
    }


@clinic_router.get("/{assessment_id}/report.pdf")
def assessment_report_pdf(
    assessment_id: int,
    current_user: User = Depends(get_current_clinician),
    db: Session = Depends(get_db),
) -> Response:
    """Render a PDF report for one assessment (clinician/admin only)."""
    assessment = (
        db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
    )
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Assessment not found")

    patient = db.query(Patient).filter(Patient.id == assessment.patient_id).first()
    display_name = (patient.full_name if patient else None) or f"Пациентка #{assessment.patient_id}"
    age = age_years(patient.birth_date) if (patient and patient.birth_date) else "—"
    image_date = assessment.created_at.date().isoformat() if assessment.created_at else "—"

    pdf = build_assessment_report_pdf(
        assessment_id=assessment.id,
        patient_id=assessment.patient_id,
        display_name=display_name,
        age=age,
        image_date=image_date,
        model_version=assessment.model_version or "—",
        model_status=assessment.model_status,
        triage_label=assessment.triage_label,
        confidence=assessment.confidence,
        clinician_decision=assessment.clinician_decision,
    )

    # Audit: generating/viewing a report is access to patient data.
    record_audit(db, current_user, "generate_report_pdf", "risk_assessment",
                 assessment.id, details={"patient_id": assessment.patient_id})

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="assessment-{assessment.id}.pdf"'},
    )


# --- Patient upload: ownership-checked ---
upload_router = APIRouter(prefix="/risk-assessment", tags=["risk-assessment"])


@upload_router.post("/upload/{patient_id}")
def upload(
    patient_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(verify_patient_access),
    _consent: None = Depends(require_active_consent),
    db: Session = Depends(get_db),
) -> dict:
    # Consent is a hard technical gate (CLAUDE.md): require_active_consent raises
    # 403 before we get here if the patient has no active consent.
    # Triage itself is still a STUB (CLAUDE.md stop-signal — not implemented
    # here). This endpoint now does real, encrypted-at-rest storage of the
    # uploaded file so retention/erasure have something real to act on.
    # Response shape respects CLAUDE.md: NO raw_score/confidence is ever returned
    # here, and the message never implies "you are healthy, no doctor needed".
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    data = file.file.read()
    try:
        image_path = save_encrypted_upload(patient_id, data)
    except FileEncryptionNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    assessment = RiskAssessment(
        patient_id=patient_id,
        image_path=image_path,
        triage_label="STUB_UNAVAILABLE",
        model_version=None,
        model_status=MODEL_STATUS_NOT_VALIDATED,
        dataset_status=DATASET_STATUS_NO_INFERENCE,
    )
    db.add(assessment)
    extend_retention(patient)
    db.add(patient)
    db.commit()
    db.refresh(assessment)

    record_audit(db, current_user, "upload_image", "risk_assessment", assessment.id,
                 details={"patient_id": patient_id})

    return {
        "patient_id": patient_id,
        "triage_label": "STUB_UNAVAILABLE",
        "patient_facing_message": (
            "Загрузка получена. Результат триажа пока недоступен: модуль не "
            "реализован. Пожалуйста, обратитесь к вашему врачу."
        ),
        "disclaimer": _DISCLAIMER,
    }
