#!/usr/bin/env python3
"""Retention-policy cron job: purge images past patients.data_retention_until.

Run on a schedule (e.g. daily), separately from the API process:
    WOMENAID_DATABASE_URL=sqlite:////path/to/womenaid.db \
    WOMENAID_FILE_ENCRYPTION_KEY=... \
    python scripts/purge_expired_data.py

Only deletes the stored image files and nulls RiskAssessment.image_path for
patients whose data_retention_until has passed; everything else (consent,
personal fields) is untouched — that is what the separate right-to-be-forgotten
endpoint (DELETE /monitoring/patients/{id}/data) is for.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow running from the repo root: make the backend package importable.
BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app.db.database import SessionLocal, init_db  # noqa: E402
from app.retention import purge_expired_images  # noqa: E402


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        summary = purge_expired_images(db)
    finally:
        db.close()
    print(
        f"[purge_expired_data] patients_checked={summary['patients_checked']} "
        f"images_deleted={summary['images_deleted']}"
    )


if __name__ == "__main__":
    main()
