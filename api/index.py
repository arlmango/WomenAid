"""Vercel serverless entry point for the WomenAId API (DEMO deployment).

Vercel runs this file as a Python serverless function. Storage is EPHEMERAL:
the SQLite DB and uploaded images live under /tmp (the only writable path on
Vercel) and are wiped on cold start, so we re-seed demo data on each cold start.

This makes the deployed site fully clickable (login, RBAC, consent, in-session
upload) but it is a DEMO, not the pilot: data does not persist and there is no
real audit/retention durability. For the pilot use the persistent container-host
backend (see deploy/Dockerfile + render.yaml).

Routing (configured in vercel.json):
    /api/*   -> this function, which mounts the real API under /api
    /health  -> this function (lightweight liveness)
    /*       -> static frontend (frontend/, served by Vercel's CDN)
The frontend already calls /api/... and /health, so no frontend changes needed.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Make the backend package importable (`app.*`).
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "backend"))

# app.config reads these at import time, so set ephemeral, writable defaults
# BEFORE importing anything from `app`. setdefault => real Vercel env vars win.
os.environ.setdefault("WOMENAID_DATABASE_URL", "sqlite:////tmp/womenaid.db")
os.environ.setdefault("WOMENAID_UPLOAD_DIR", "/tmp/uploads")
# Demo-only key so in-session uploads work out of the box. The /tmp data it
# protects is thrown away on cold start; set a real WOMENAID_FILE_ENCRYPTION_KEY
# (and WOMENAID_SECRET_KEY) in the Vercel project env for anything non-throwaway.
os.environ.setdefault(
    "WOMENAID_FILE_ENCRYPTION_KEY", "3L6AfF7suBzUsFw6_iQXgwUyd4PA_rgI6JxCchT81_Q="
)

os.makedirs(os.environ["WOMENAID_UPLOAD_DIR"], exist_ok=True)

from fastapi import FastAPI  # noqa: E402

from app.consent import record_consent, sync_consent_flag  # noqa: E402
from app.db.database import SessionLocal, init_db  # noqa: E402
from app.main import app as inner_app  # noqa: E402  (the real WomenAId API)
from app.models.patient import Patient  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

DEMO_PASSWORD = "demo1234"


def _seed_if_empty() -> None:
    """Create tables and a small demo dataset if this /tmp DB is fresh."""
    init_db()
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "demo_doc").first():
            return  # already seeded in this warm instance
        from datetime import date, timedelta

        today = date.today()
        db.add(User(username="demo_doc", hashed_password=hash_password(DEMO_PASSWORD),
                    role="clinician"))
        db.add(User(username="admin", hashed_password=hash_password(DEMO_PASSWORD),
                    role="admin"))
        # A few patients with active consent + linked patient logins
        # (patient1..patient3 / demo1234), so login + consent + upload all work.
        for i in range(1, 4):
            patient = Patient(
                full_name=f"Демо Пациентка {i}",
                birth_date=today - timedelta(days=365 * 40),
                last_screening_date=today - timedelta(days=365),
            )
            db.add(patient)
            db.flush()
            record_consent(db, patient.id, "v1.0",
                           "Я согласна на AI-обработку снимка (демо-текст).")
            sync_consent_flag(db, patient)
            db.add(User(username=f"patient{i}",
                        hashed_password=hash_password(DEMO_PASSWORD),
                        role="patient", patient_id=patient.id))
        db.commit()
    finally:
        db.close()


_seed_if_empty()

# Parent ASGI app Vercel serves. The real API is mounted under /api so the
# frontend's existing /api/... calls resolve (mount strips the /api prefix).
app = FastAPI(title="WomenAId (Vercel demo)")
app.mount("/api", inner_app)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
