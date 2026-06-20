"""Patient model.

Minimal real table so the auth layer has a genuine FK target. Clinical /
screening fields are intentionally NOT modelled here — that is product
business logic outside the scope of the auth task (see CLAUDE.md).
"""
from __future__ import annotations

from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String

from app.db.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    # Demographic fields collected at self-registration (POST /auth/register).
    # Optional, contact/locale context only — not used in any clinical logic.
    phone = Column(String, nullable=True)
    region = Column(String, nullable=True)
    # None = not yet recorded; True/False = recorded consent decision.
    consent_given = Column(Boolean, nullable=True)
    # Used to derive screening status (see app/models/screening_rules.py).
    birth_date = Column(Date, nullable=True)
    last_screening_date = Column(Date, nullable=True)
    # Set/extended on each upload (see app/retention.py::extend_retention).
    # Null = no stored images yet, nothing for the purge job to act on.
    data_retention_until = Column(DateTime, nullable=True)
