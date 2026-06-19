"""Schemas for the symptom-diary endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field


class SymptomCreateRequest(BaseModel):
    symptom_text: str = Field(min_length=1, max_length=2000)
