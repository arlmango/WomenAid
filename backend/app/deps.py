"""Auth dependencies: current user resolution and role/ownership guards."""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import ALGORITHM, SECRET_KEY
from app.db.database import get_db
from app.models.user import CLINICIAN_ROLES, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Decode the bearer token and load the matching user, or 401."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise _credentials_exc
    except JWTError:
        raise _credentials_exc

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise _credentials_exc
    return user


def get_current_clinician(current_user: User = Depends(get_current_user)) -> User:
    """Require clinician or admin role, else 403."""
    if current_user.role not in CLINICIAN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinician or admin role required",
        )
    return current_user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role, else 403."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


def verify_patient_access(
    patient_id: int, current_user: User = Depends(get_current_user)
) -> User:
    """Allow clinicians/admins to access any patient; a patient only their own.

    `patient_id` is taken from the request path (works as a route- or
    router-level dependency on paths containing `{patient_id}`).
    """
    if current_user.role in CLINICIAN_ROLES:
        return current_user
    if current_user.role == "patient" and current_user.patient_id == patient_id:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this patient's data",
    )
