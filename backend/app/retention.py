"""Retention policy + right-to-be-forgotten ("право на забвение") logic.

Three operations live here:
  - extend_retention: called on every upload, pushes data_retention_until out.
  - purge_expired_images: called by scripts/purge_expired_data.py (cron) —
    deletes image files past their retention deadline.
  - erase_patient_data: called by DELETE /monitoring/patients/{id}/data —
    deletes images + personal fields, optionally keeping a non-identifying
    statistical row per erased assessment.

Erasure never touches audit_log: that log's entire purpose is an immutable
record of past access, and AuditLog.target_id has no FK constraint, so it is
safe for it to keep referring to an assessment/patient that no longer exists
in its original form.
"""
from __future__ import annotations

import secrets
from datetime import timedelta

from sqlalchemy.orm import Session

from app.audit import record_audit
from app.config import DEFAULT_RETENTION_DAYS, KEEP_ANONYMIZED_STATS_ON_ERASURE
from app.consent import sync_consent_flag, withdraw_active_consent
from app.models.anonymized_stat import AnonymizedAssessmentStat
from app.models.patient import Patient
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.security import hash_password
from app.storage import delete_upload_file
from app.timeutils import utcnow_naive

SYSTEM_ACTOR_USERNAME = "system_retention_job"


def extend_retention(patient: Patient) -> None:
    """Push data_retention_until to DEFAULT_RETENTION_DAYS from now.

    Called on every upload, so the window is always measured from the most
    recent activity, not the patient's first visit.
    """
    patient.data_retention_until = utcnow_naive() + timedelta(days=DEFAULT_RETENTION_DAYS)


def get_system_actor(db: Session) -> User:
    """Return (creating if needed) the synthetic actor for unattended jobs.

    The password hash is a random value nobody knows — this account is not
    meant to ever log in, it only exists to satisfy audit_log's non-nullable
    actor_user_id for cron-job-driven audit entries.
    """
    actor = db.query(User).filter(User.username == SYSTEM_ACTOR_USERNAME).first()
    if actor is not None:
        return actor
    actor = User(
        username=SYSTEM_ACTOR_USERNAME,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        role="system",
    )
    db.add(actor)
    db.commit()
    db.refresh(actor)
    return actor


def purge_expired_images(db: Session) -> dict:
    """Delete image files (and null image_path) for patients past retention."""
    now = utcnow_naive()
    expired_patients = (
        db.query(Patient)
        .filter(Patient.data_retention_until.isnot(None), Patient.data_retention_until < now)
        .all()
    )
    actor = get_system_actor(db)
    images_deleted = 0
    for patient in expired_patients:
        assessments = (
            db.query(RiskAssessment)
            .filter(
                RiskAssessment.patient_id == patient.id,
                RiskAssessment.image_path.isnot(None),
            )
            .all()
        )
        for assessment in assessments:
            delete_upload_file(assessment.image_path)
            assessment.image_path = None
            images_deleted += 1
            record_audit(
                db,
                actor,
                "retention_purge_image",
                "risk_assessment",
                assessment.id,
                details={
                    "patient_id": patient.id,
                    "reason": "retention_expired",
                    "data_retention_until": patient.data_retention_until.isoformat(),
                },
            )
    db.commit()
    return {"patients_checked": len(expired_patients), "images_deleted": images_deleted}


def erase_patient_data(db: Session, patient: Patient) -> dict:
    """Right-to-be-forgotten: erase images + personal fields for one patient.

    Per assessment with a stored image: delete the file, optionally copy a
    non-identifying stat row (gated by KEEP_ANONYMIZED_STATS_ON_ERASURE), then
    delete the RiskAssessment row itself (its patient_id FK is non-nullable,
    so it can't be kept around de-identified in place).
    """
    assessments = db.query(RiskAssessment).filter(RiskAssessment.patient_id == patient.id).all()
    images_deleted = 0
    stats_created = 0
    for assessment in assessments:
        if assessment.image_path:
            delete_upload_file(assessment.image_path)
            images_deleted += 1
        if KEEP_ANONYMIZED_STATS_ON_ERASURE:
            db.add(
                AnonymizedAssessmentStat(
                    triage_label=assessment.triage_label,
                    model_version=assessment.model_version,
                    model_status=assessment.model_status,
                    dataset_status=assessment.dataset_status,
                    original_created_at=assessment.created_at,
                )
            )
            stats_created += 1
        db.delete(assessment)

    withdrawn = withdraw_active_consent(db, patient.id)
    patient.full_name = None
    patient.birth_date = None
    patient.last_screening_date = None
    patient.data_retention_until = None
    sync_consent_flag(db, patient)
    db.commit()

    return {
        "assessments_erased": len(assessments),
        "images_deleted": images_deleted,
        "anonymized_stats_created": stats_created,
        "consent_withdrawn": withdrawn,
    }
