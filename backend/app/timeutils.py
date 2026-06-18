"""Small time helpers shared across models/services."""
from __future__ import annotations

from datetime import datetime, timezone


def utcnow_naive() -> datetime:
    """UTC timestamp, tz-stripped so it compares cleanly with SQLite columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
