"""Pydantic schemas for authentication."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: int
    username: str
    role: str
    patient_id: Optional[int] = None

    model_config = {"from_attributes": True}
