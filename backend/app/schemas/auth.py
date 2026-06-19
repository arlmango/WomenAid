"""Pydantic schemas for authentication."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    """Patient self-registration. Always creates role=patient — clinician/admin
    accounts are provisioned out-of-band (scripts/create_user.py), never via
    this public endpoint."""

    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):
    id: int
    username: str
    role: str
    patient_id: Optional[int] = None

    model_config = {"from_attributes": True}
