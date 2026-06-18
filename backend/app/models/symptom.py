"""Symptom diary entry model."""
from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.database import Base
from app.timeutils import utcnow_naive


class SymptomEntry(Base):
    __tablename__ = "symptom_entries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    reported_at = Column(DateTime, nullable=False, default=utcnow_naive)
    symptom_text = Column(Text, nullable=False)
    # Computed via screening_rules.evaluate_symptom; red-flag always -> see a doctor.
    is_red_flag = Column(Boolean, nullable=False, default=False)
