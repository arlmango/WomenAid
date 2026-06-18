"""Admin-only routes: audit log access."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_admin
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogPublic

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)


@router.get("/audit-log", response_model=List[AuditLogPublic])
def get_audit_log(
    db: Session = Depends(get_db),
    patient_id: Optional[int] = Query(
        None,
        description="Filter to patient-targeted events (target_type='patient', "
        "target_id=patient_id). Assessment/appointment events carry the patient "
        "in `details`.",
    ),
    start: Optional[datetime] = Query(
        None, description="Inclusive lower bound on created_at (UTC, ISO 8601)."
    ),
    end: Optional[datetime] = Query(
        None, description="Inclusive upper bound on created_at (UTC, ISO 8601)."
    ),
    limit: int = Query(200, ge=1, le=1000),
) -> List[AuditLog]:
    query = db.query(AuditLog)
    if patient_id is not None:
        query = query.filter(
            AuditLog.target_type == "patient", AuditLog.target_id == patient_id
        )
    if start is not None:
        query = query.filter(AuditLog.created_at >= start)
    if end is not None:
        query = query.filter(AuditLog.created_at <= end)
    return (
        query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
        .all()
    )
