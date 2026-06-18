"""Password hashing (passlib/bcrypt) and JWT creation (python-jose)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str,
    patient_id: Optional[int] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    """Build a signed JWT carrying the username (sub), role, and patient_id."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    claims = {"sub": subject, "role": role, "patient_id": patient_id, "exp": expire}
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)
