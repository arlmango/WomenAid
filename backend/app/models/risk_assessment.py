"""Risk assessment record model.

Per CLAUDE.md every risk-assessment record MUST carry a model-status field that
makes explicit the model has not passed clinical validation (model_status), and
the triage_label is one of the fixed categories. raw_score / confidence are
stored here (clinician-only) and must never be exposed on patient-facing
endpoints.
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.db.database import Base
from app.timeutils import utcnow_naive

# The only allowed triage categories (CLAUDE.md). Never a "diagnosis".
TRIAGE_LABELS = [
    "INSUFFICIENT_QUALITY",
    "ROUTINE_FOLLOWUP",
    "PRIORITY_REVIEW",
    "URGENT_REVIEW",
]

# Until the model is clinically validated, every record is marked as such.
MODEL_STATUS_NOT_VALIDATED = "NOT_CLINICALLY_VALIDATED"
DATASET_STATUS_DEMO = "DEMO_SYNTHETIC_NOT_CLINICAL"
# A real (non-demo) upload was stored, but no model ran — upload() is still a
# stub (see app/routers/risk_assessment.py). Distinct from DATASET_STATUS_DEMO
# so a real-patient row never implies a demo model produced its triage_label.
DATASET_STATUS_NO_INFERENCE = "NO_INFERENCE_STUB"
MODEL_VERSION_DEMO = "demo-rf-0.0"


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    # Nullable: demo records may have no real image file.
    image_path = Column(String, nullable=True)
    triage_label = Column(String, nullable=False)  # one of TRIAGE_LABELS
    raw_score = Column(Float, nullable=True)  # clinician-only; never patient-facing
    confidence = Column(Float, nullable=True)  # clinician-only; never patient-facing
    model_version = Column(String, nullable=True, default=MODEL_VERSION_DEMO)
    # Required by CLAUDE.md: explicit clinical-validation status of the model.
    model_status = Column(String, nullable=False, default=MODEL_STATUS_NOT_VALIDATED)
    dataset_status = Column(String, nullable=False, default=DATASET_STATUS_DEMO)
    # Filled by a clinician after review; shown on the PDF report if present.
    clinician_decision = Column(Text, nullable=True)
