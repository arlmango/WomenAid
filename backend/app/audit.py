"""Helper for writing audit_log entries."""
from __future__ import annotations

import json
from typing import Any, Optional, Union

from sqlalchemy.orm import Session

from app.models.audit import AUDIT_TARGET_TYPES, AuditLog
from app.models.user import User


def record_audit(
    db: Session,
    actor: User,
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[Union[str, dict, list]] = None,
) -> AuditLog:
    """Persist a single audit entry. `details` may be a str or a JSON-able obj."""
    if target_type not in AUDIT_TARGET_TYPES:
        raise ValueError(f"invalid target_type: {target_type!r}")

    if isinstance(details, (dict, list)):
        details = json.dumps(details, ensure_ascii=False)

    entry = AuditLog(
        actor_user_id=actor.id,
        actor_role=actor.role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
