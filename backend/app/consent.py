"""Consent service: source of truth is consent_records.

`patients.consent_given` is a denormalized, always-synced cache of "does an
active (non-withdrawn) consent exist?". Per CLAUDE.md, no active consent means
AI analysis is technically blocked (see require_active_consent).
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.consent import ConsentRecord
from app.models.patient import Patient
from app.timeutils import utcnow_naive

# Canonical consent text + version. Single source of truth: the registration
# endpoint records exactly this snapshot, and GET /auth/consent-text exposes
# it so the frontend never has to keep its own (possibly drifting) copy.
CONSENT_VERSION = "v1.0"
CONSENT_TEXT = (
    "Я даю согласие на обработку моих персональных данных и загруженных "
    "снимков сервисом WomenAId для AI-триажа и мониторинга скрининга. "
    "Я понимаю, что результат AI-анализа — вспомогательная информация для "
    "маршрутизации (decision-support), а не медицинский диагноз, и что "
    "окончательное решение всегда принимает врач. Я могу отозвать это "
    "согласие в любой момент в личном кабинете; после отзыва AI-анализ "
    "новых снимков технически становится невозможен."
)


def has_active_consent(db: Session, patient_id: int) -> bool:
    """True iff the patient has at least one consent without a withdrawn_at."""
    return (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.patient_id == patient_id,
            ConsentRecord.withdrawn_at.is_(None),
        )
        .first()
        is not None
    )


def sync_consent_flag(db: Session, patient: Patient) -> None:
    """Recompute patients.consent_given from consent_records (keep cache honest)."""
    # Session uses autoflush=False, so flush pending consent writes first —
    # otherwise the recompute query would read stale (pre-withdrawal) state.
    db.flush()
    patient.consent_given = has_active_consent(db, patient.id)
    db.add(patient)


def record_consent(
    db: Session, patient_id: int, version: str, snapshot: str
) -> ConsentRecord:
    """Insert a new active consent record."""
    record = ConsentRecord(
        patient_id=patient_id,
        consent_text_version=version,
        consent_text_snapshot=snapshot,
        given_at=utcnow_naive(),
    )
    db.add(record)
    db.flush()
    return record


def withdraw_active_consent(db: Session, patient_id: int) -> int:
    """Mark all active consents for the patient as withdrawn; return how many."""
    active = (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.patient_id == patient_id,
            ConsentRecord.withdrawn_at.is_(None),
        )
        .all()
    )
    now = utcnow_naive()
    for record in active:
        record.withdrawn_at = now
        db.add(record)
    return len(active)


def require_active_consent(patient_id: int, db: Session = Depends(get_db)) -> None:
    """FastAPI dependency: hard-block any AI path when consent is not active.

    This is the *technical* enforcement of the CLAUDE.md rule — not just policy.
    """
    if not has_active_consent(db, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Активное согласие пациентки отсутствует — AI-анализ невозможен."
            ),
        )
