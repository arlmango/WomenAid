"""Pydantic schemas for authentication."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    """Patient self-registration. Always creates role=patient — clinician/admin
    accounts are provisioned out-of-band (scripts/create_user.py), never via
    this public endpoint.

    `consent` is a required, explicit field — see the stop-signal rule in
    CLAUDE.md ("без активного согласия — AI-анализ невозможен технически").
    The endpoint rejects registration with 400 if it isn't `true`; this is
    the technical gate, not just form validation (see app/routers/auth.py).
    """

    display_name: str = Field(min_length=1, max_length=200)
    birth_date: date
    phone: Optional[str] = Field(default=None, max_length=32)
    region: Optional[str] = Field(default=None, max_length=100)
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    consent: bool

    @field_validator("birth_date")
    @classmethod
    def _not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Дата рождения не может быть в будущем.")
        return value


class UserPublic(BaseModel):
    id: int
    username: str
    role: str
    patient_id: Optional[int] = None

    model_config = {"from_attributes": True}
