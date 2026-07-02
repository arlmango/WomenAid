"""Risk-assessment routes.

The upload endpoint runs a real (non-AI) photo-quality gate — see
app/ml/image_quality.py and app/ml/inference.py for why there is no AI
classifier wired in yet (the only trained model exists, but is fit on
synthetic random noise unrelated to real images; connecting it would produce
arbitrary, not-real predictions). Everything else here (queue, review, PDF)
reads/writes real `risk_assessments` rows — none of it is a stub.

Access rules (CLAUDE.md):
  - /risk-assessment/clinic/*           -> clinician/admin only
  - /risk-assessment/upload/{patient_id}-> clinician/admin, or the patient themselves
"""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.audit import record_audit
from app.consent import require_active_consent
from app.db.database import get_db
from app.deps import get_current_clinician, verify_patient_access
from app.encryption import FileEncryptionNotConfigured, decrypt_bytes
from app.ml.image_quality import assess_image_quality
from app.ml.inference import DISCLAIMER, PENDING_REVIEW_MESSAGE, patient_message_for_quality_failure
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

    rows = (
        db.query(RiskAssessment, Patient)
        .outerjoin(Patient, Patient.id == RiskAssessment.patient_id)
        .order_by(RiskAssessment.created_at.desc())
        .all()
    )
    items = [
        {
            "id": assessment.id,
            "patient_id": assessment.patient_id,
            "patient_name": (patient.full_name if patient else None),
            "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
            "triage_label": assessment.triage_label,
            # Clinician-only fields — never sent from any patient-facing endpoint.
            "raw_score": assessment.raw_score,
            "confidence": assessment.confidence,
            "model_version": assessment.model_version,
            "model_status": assessment.model_status,
            "dataset_status": assessment.dataset_status,
            "clinician_decision": assessment.clinician_decision,
        }
        for assessment, patient in rows
    ]
    return {"items": items}


@clinic_router.post("/review/{assessment_id}")
def review_assessment(
    assessment_id: int,
    review: ReviewRequest,
    current_user: User = Depends(get_current_clinician),
    db: Session = Depends(get_db),
) -> dict:
    """Persist a clinician's review decision on a real assessment row.

    The decision is the CLINICIAN's input (a human judgment call), never an
    AI output — it is stored verbatim in `clinician_decision` and shown on
    the PDF report.
    """
    assessment = db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    assessment.clinician_decision = (
        f"{review.decision}: {review.note}" if review.note else review.decision
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    record_audit(
        db,
        current_user,
        "review_assessment",
        "risk_assessment",
        assessment_id,
        details={
            "decision": review.decision,
            "patient_id": review.patient_id or assessment.patient_id,
            "note": review.note,
        },
    )
    return {
        "assessment_id": assessment.id,
        "decision": review.decision,
        "clinician_decision": assessment.clinician_decision,
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


@clinic_router.get("/{assessment_id}/image")
def assessment_image(
    assessment_id: int,
    current_user: User = Depends(get_current_clinician),
    db: Session = Depends(get_db),
) -> Response:
    """Serve the original uploaded snapshot for in-cabinet review
    (clinician/admin only — same access rule as the PDF report).

    The file is decrypted only for this response; on-disk it stays encrypted
    (app/storage.py). Viewing is audited like the PDF report: it is access to
    patient data. `Cache-Control: no-store` keeps the decrypted image out of
    shared caches.
    """
    assessment = (
        db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
    )
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Assessment not found")
    if not assessment.image_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No image stored for this assessment")

    try:
        encrypted = Path(assessment.image_path).read_bytes()
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Image file not found (possibly purged by retention)")
    data = decrypt_bytes(encrypted)

    if data[:3] == b"\xff\xd8\xff":
        media_type = "image/jpeg"
    elif data[:8] == b"\x89PNG\r\n\x1a\n":
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"

    record_audit(db, current_user, "view_image", "risk_assessment",
                 assessment.id, details={"patient_id": assessment.patient_id})

    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="assessment-{assessment.id}"',
            "Cache-Control": "no-store",
        },
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
    #
    # Real, working photo-quality gate (app/ml/image_quality.py) — deterministic
    # classical image statistics, NOT an AI triage classifier (none exists yet,
    # see that module's docstring). A photo that passes is queued as
    # PENDING_REVIEW for a clinician; one that fails is INSUFFICIENT_QUALITY
    # with a specific, actionable reason. Neither path ever implies "you are
    # healthy" and neither ever returns raw_score/confidence to the patient.
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    data = file.file.read()
    quality = assess_image_quality(data)

    try:
        image_path = save_encrypted_upload(patient_id, data)
    except FileEncryptionNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    if quality.passed:
        triage_label = "PENDING_REVIEW"
        patient_message = PENDING_REVIEW_MESSAGE
    else:
        triage_label = "INSUFFICIENT_QUALITY"
        patient_message = patient_message_for_quality_failure(quality)

    assessment = RiskAssessment(
        patient_id=patient_id,
        image_path=image_path,
        triage_label=triage_label,
        model_version=None,
        model_status=MODEL_STATUS_NOT_VALIDATED,
        dataset_status=DATASET_STATUS_NO_INFERENCE,
    )
    db.add(assessment)
    extend_retention(patient)
    db.add(patient)
    db.commit()
    db.refresh(assessment)

    record_audit(
        db, current_user, "upload_image", "risk_assessment", assessment.id,
        details={
            "patient_id": patient_id,
            "quality_reason": quality.reason,
            "quality_metrics": {
                "width": quality.width,
                "height": quality.height,
                "brightness_mean": quality.brightness_mean,
                "edge_stddev": quality.edge_stddev,
            },
        },
    )

    return {
        "patient_id": patient_id,
        "triage_label": triage_label,
        "patient_facing_message": patient_message,
        "disclaimer": DISCLAIMER,
    }
