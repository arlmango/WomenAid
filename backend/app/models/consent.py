"""Consent record model.

A real, honest consent model for the pilot: each consent captures the exact
text version and a snapshot of the text the patient agreed to, when it was
given, and (if revoked) when it was withdrawn. `patients.consent_given` is kept
as a synced/computed flag — true iff an active (non-withdrawn) consent exists.
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.database import Base
from app.timeutils import utcnow_naive


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    consent_text_version = Column(String, nullable=False)
    consent_text_snapshot = Column(Text, nullable=False)
    given_at = Column(DateTime, nullable=False, default=utcnow_naive)
    withdrawn_at = Column(DateTime, nullable=True)
