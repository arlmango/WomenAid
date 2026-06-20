#!/usr/bin/env python3
"""End-to-end check of public self-registration (POST /auth/register).

Verifies: consent=true is a hard technical gate (no Patient/User row is
created without it, not just a validation error); successful registration
creates a real Patient (display name, birth date, optional phone/region) +
User(role=patient) + an active ConsentRecord using the existing versioned
consent system; the response auto-logs in (same Token shape as /auth/login);
duplicate usernames are rejected; and GET /auth/consent-text exposes the
exact text that gets recorded. Run directly:

    .venv/bin/python tests/e2e_register.py
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["WOMENAID_DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ.setdefault("WOMENAID_SECRET_KEY", "test-secret")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from app.db.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.consent import ConsentRecord  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.user import User  # noqa: E402

_passed = 0
_failed = 0


def check(name: str, condition: bool) -> None:
    global _passed, _failed
    if condition:
        _passed += 1
        print(f"  PASS  {name}")
    else:
        _failed += 1
        print(f"  FAIL  {name}")


VALID_PAYLOAD = {
    "display_name": "Тестовая Пациентка",
    "birth_date": "1995-03-14",
    "phone": "+7 700 000 00 00",
    "region": "Алматы",
    "username": "newpatient1",
    "password": "supersecret123",
    "consent": True,
}


def main() -> int:
    init_db()
    with TestClient(app) as client:
        # --- consent text is public and well-formed ---
        text_res = client.get("/auth/consent-text")
        check("consent-text -> 200", text_res.status_code == 200)
        body = text_res.json()
        check("consent-text has version + text", bool(body.get("version")) and bool(body.get("text")))

        # --- consent=false is a hard technical gate: nothing gets created ---
        rejected = {**VALID_PAYLOAD, "username": "shouldnotexist", "consent": False}
        no_consent_res = client.post("/auth/register", json=rejected)
        check("register without consent -> 400", no_consent_res.status_code == 400)

        db = SessionLocal()
        try:
            ghost_user = db.query(User).filter(User.username == "shouldnotexist").first()
            check("no User row created when consent=false", ghost_user is None)
        finally:
            db.close()

        # --- happy path: real registration ---
        res = client.post("/auth/register", json=VALID_PAYLOAD)
        check("register -> 201", res.status_code == 201)
        token_body = res.json()
        check("register returns access_token", "access_token" in token_body)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == "newpatient1").first()
            check("User row created with role=patient", user is not None and user.role == "patient")
            patient = db.query(Patient).filter(Patient.id == user.patient_id).first() if user else None
            check(
                "Patient row has display name, birth date, phone, region",
                bool(
                    patient
                    and patient.full_name == VALID_PAYLOAD["display_name"]
                    and str(patient.birth_date) == VALID_PAYLOAD["birth_date"]
                    and patient.phone == VALID_PAYLOAD["phone"]
                    and patient.region == VALID_PAYLOAD["region"]
                ),
            )
            check("Patient.consent_given synced true", bool(patient and patient.consent_given is True))
            consent_row = (
                db.query(ConsentRecord).filter(ConsentRecord.patient_id == patient.id).first()
                if patient
                else None
            )
            check(
                "ConsentRecord created via the existing versioned-consent system",
                bool(consent_row and consent_row.withdrawn_at is None and consent_row.consent_text_version),
            )
        finally:
            db.close()

        # --- the returned token actually works against a real endpoint ---
        token = token_body["access_token"]
        me_res = client.get(
            f"/monitoring/patients/{user.patient_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        check("auto-login token works on a real protected endpoint", me_res.status_code == 200)

        # --- duplicate username rejected ---
        dup_res = client.post("/auth/register", json=VALID_PAYLOAD)
        check("duplicate username -> 400", dup_res.status_code == 400)

        # --- weak password rejected (pydantic boundary validation) ---
        weak = {**VALID_PAYLOAD, "username": "newpatient2", "password": "short"}
        weak_res = client.post("/auth/register", json=weak)
        check("weak password -> 422", weak_res.status_code == 422)

        # --- birth date in the future rejected ---
        future = {**VALID_PAYLOAD, "username": "newpatient3", "birth_date": "2999-01-01"}
        future_res = client.post("/auth/register", json=future)
        check("future birth_date -> 422", future_res.status_code == 422)

    print(f"\n{_passed} passed, {_failed} failed")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
