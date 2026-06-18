"""Anonymized statistical record kept after a right-to-be-forgotten erasure.

Deliberately has NO patient_id / FK back to `patients` — that link is exactly
what erasure severs. Only the fields needed for aggregate analytics (e.g.
"how many URGENT_REVIEW results has the demo model produced") are copied over
before the source RiskAssessment row is deleted. See app/retention.py.
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, String

from app.db.database import Base
from app.timeutils import utcnow_naive


class AnonymizedAssessmentStat(Base):
    __tablename__ = "anonymized_assessment_stats"

    id = Column(Integer, primary_key=True, index=True)
    triage_label = Column(String, nullable=False)
    model_version = Column(String, nullable=True)
    model_status = Column(String, nullable=False)
    dataset_status = Column(String, nullable=False)
    original_created_at = Column(DateTime, nullable=False)
    erased_at = Column(DateTime, nullable=False, default=utcnow_naive)
