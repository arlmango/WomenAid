"""Authentication routes: POST /auth/login, POST /auth/register."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.audit import record_audit
from app.db.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.auth import RegisterRequest, Token
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


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
    fresh, empty `Patient` record. Clinician/admin accounts are never created
    here; they're provisioned out-of-band (scripts/create_user.py), so this
    endpoint can't be used to grant clinical/RBAC access.
    """
    if db.query(User).filter(User.username == payload.username).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот логин уже занят.",
        )

    patient = Patient()
    db.add(patient)
    db.flush()  # assign patient.id for the User FK below

    user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role="patient",
        patient_id=patient.id,
    )
    db.add(user)
    db.flush()  # assign user.id so record_audit has a real actor_user_id

    record_audit(db, user, "register", "patient", patient.id)  # commits everything above too

    token = create_access_token(subject=user.username, role=user.role, patient_id=user.patient_id)
    return Token(access_token=token)
