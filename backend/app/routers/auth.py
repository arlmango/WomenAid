"""Authentication routes: POST /auth/login, POST /auth/register."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.audit import record_audit
from app.consent import CONSENT_TEXT, CONSENT_VERSION, record_consent, sync_consent_flag
from app.db.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.auth import RegisterRequest, Token
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/consent-text")
def consent_text() -> dict:
    """Public — the canonical consent text + version, so the registration
    form can render the exact text that /auth/register will record (single
    source of truth, see app/consent.py)."""
    return {"version": CONSENT_VERSION, "text": CONSENT_TEXT}


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Token:
    """Exchange username + password (form-encoded) for a JWT access token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        subject=user.username, role=user.role, patient_id=user.patient_id
    )
    return Token(access_token=token)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> Token:
    """Public self-registration — always creates a `patient` account with a
    real `Patient` record (display name/birth date/optional phone+region) and
    an active consent record. Clinician/admin accounts are never created
    here; they're provisioned out-of-band (scripts/create_user.py), so this
    endpoint can't be used to grant clinical/RBAC access.

    Consent is a hard technical gate (CLAUDE.md), the same as the upload
    endpoint's `require_active_consent`: without `consent=true`, nothing is
    written at all — not a softer "registered but unconsented" state.
    """
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Регистрация требует согласия на участие.",
        )

    if db.query(User).filter(User.username == payload.username).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот логин уже занят.",
        )

    patient = Patient(
        full_name=payload.display_name,
        birth_date=payload.birth_date,
        phone=payload.phone,
        region=payload.region,
    )
    db.add(patient)
    db.flush()  # assign patient.id for the User FK + consent record below

    user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role="patient",
        patient_id=patient.id,
    )
    db.add(user)
    db.flush()  # assign user.id so record_audit has a real actor_user_id

    # Reuse the existing versioned-consent system (same mechanism as
    # POST /monitoring/patients/{id}/consent) — not a parallel one.
    record_consent(db, patient.id, CONSENT_VERSION, CONSENT_TEXT)
    sync_consent_flag(db, patient)

    record_audit(
        db, user, "register", "patient", patient.id,
        details={"consent_version": CONSENT_VERSION},
    )  # commits everything above too

    token = create_access_token(subject=user.username, role=user.role, patient_id=user.patient_id)
    return Token(access_token=token)
