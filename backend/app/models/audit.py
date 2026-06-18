"""Audit log model — records who accessed/changed patient data, and when.

Required for the clinic data-protection conversation ("who viewed a patient's
data, and when"). See README.md -> "Путь к пилоту".
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.database import Base
from app.timeutils import utcnow_naive

# Allowed target_type values.
AUDIT_TARGET_TYPES = {"patient", "risk_assessment", "appointment"}


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=False)  # one of AUDIT_TARGET_TYPES
    target_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive, index=True)
    details = Column(Text, nullable=True)
