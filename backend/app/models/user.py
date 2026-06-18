"""User model and role definitions for authentication/authorization."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base

# Allowed roles. `patient` users are linked to a row in `patients` via patient_id.
# "system" is for automated jobs only (e.g. the retention-purge cron script),
# so audit_log entries it writes have a real, non-nullable actor_user_id. It is
# never granted clinician/admin permissions (see app/deps.py: those checks use
# CLINICIAN_ROLES / exact role equality, never the full ROLES set).
ROLES = {"patient", "clinician", "admin", "system"}
CLINICIAN_ROLES = {"clinician", "admin"}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # one of ROLES
    # Set only for role == "patient": links the login to its own patient record.
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)

    patient = relationship("Patient")
