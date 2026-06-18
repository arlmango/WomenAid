"""Schemas for audit log output and clinic review/consent inputs."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditLogPublic(BaseModel):
    id: int
    actor_user_id: int
    actor_role: str
    action: str
    target_type: str
    target_id: Optional[int] = None
    created_at: datetime
    details: Optional[str] = None

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    """A clinician's review decision on an assessment (recorded in the audit log)."""

    decision: str
    patient_id: Optional[int] = None
    note: Optional[str] = None


class ConsentCreateRequest(BaseModel):
    """Records consent to a specific, explicitly-passed text version + snapshot."""

    consent_text_version: str
    consent_text_snapshot: str
