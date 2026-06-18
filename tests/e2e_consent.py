#!/usr/bin/env python3
"""End-to-end check of versioned consent + the consent gate on AI upload.

Verifies: upload is blocked without active consent; recording consent (with an
explicit text version + snapshot) unblocks it; withdrawing consent re-blocks it;
patients.consent_given stays in sync as a computed flag; and access control on
the consent endpoints. Run directly:

    .venv/bin/python tests/e2e_consent.py
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
os.environ.setdefault("WOMENAID_FILE_ENCRYPTION_KEY",
                       "juKNQw2ak6HsH90lm5v0nxs1lvo0krCfYxt6o1jlVh8=")
os.environ["WOMENAID_UPLOAD_DIR"] = tempfile.mkdtemp(prefix="womenaid_uploads_")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from app.db.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.consent import ConsentRecord  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

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


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        # No consent seeded — patients start un-consented on purpose.
        db.add_all([Patient(id=1, full_name="Patient One"),
                    Patient(id=2, full_name="Patient Two")])
        db.flush()
        db.add_all([
            User(username="admin", hashed_password=hash_password("adminpw"), role="admin"),
            User(username="doc", hashed_password=hash_password("docpw"), role="clinician"),
            User(username="alice", hashed_password=hash_password("alicepw"),
                 role="patient", patient_id=1),
            User(username="bob", hashed_password=hash_password("bobpw"),
                 role="patient", patient_id=2),
        ])
        db.commit()
    finally:
        db.close()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def fake_image() -> dict:
    return {"file": ("scan.jpg", b"fake-image-bytes", "image/jpeg")}


def tok(client: TestClient, username: str, password: str) -> str:
    return client.post("/auth/login",
                       data={"username": username, "password": password}).json()["access_token"]


def patient_flag(patient_id: int):
    db = SessionLocal()
    try:
        return db.query(Patient).filter(Patient.id == patient_id).first().consent_given
    finally:
        db.close()


def active_consent_count(patient_id: int) -> int:
    db = SessionLocal()
    try:
        return (
            db.query(ConsentRecord)
            .filter(ConsentRecord.patient_id == patient_id,
                    ConsentRecord.withdrawn_at.is_(None))
            .count()
        )
    finally:
        db.close()


def main() -> int:
    seed()
    with TestClient(app) as client:
        alice = tok(client, "alice", "alicepw")
        bob = tok(client, "bob", "bobpw")
        doc = tok(client, "doc", "docpw")

        # --- before consent: upload blocked (technical gate), for anyone ---
        check("computed flag starts unset (None)", patient_flag(1) is None)
        r = client.post("/risk-assessment/upload/1", headers=bearer(alice), files=fake_image())
        check("alice upload without consent -> 403", r.status_code == 403)
        check("403 message mentions consent (AI-анализ невозможен)",
              "невозможен" in r.json().get("detail", ""))
        check("doc upload without patient consent -> 403 (gate ignores actor)",
              client.post("/risk-assessment/upload/1", headers=bearer(doc),
                          files=fake_image()).status_code == 403)

        # --- record consent with explicit version + snapshot ---
        g = client.post("/monitoring/patients/1/consent", headers=bearer(alice),
                        json={"consent_text_version": "v1.0",
                              "consent_text_snapshot": "Я согласна на AI-обработку снимка."})
        gb = g.json()
        check("record consent -> 200", g.status_code == 200)
        check("response: consent_given true + record id + version + given_at",
              gb.get("consent_given") is True and isinstance(gb.get("consent_record_id"), int)
              and gb.get("consent_text_version") == "v1.0" and bool(gb.get("given_at")))
        check("computed flag now True", patient_flag(1) is True)
        check("snapshot persisted in consent_records",
              _snapshot_ok(1, "v1.0", "Я согласна на AI-обработку снимка."))

        # --- after consent: upload allowed ---
        up = client.post("/risk-assessment/upload/1", headers=bearer(alice), files=fake_image())
        check("alice upload with consent -> 200", up.status_code == 200)
        check("doc upload with consent -> 200",
              client.post("/risk-assessment/upload/1", headers=bearer(doc),
                          files=fake_image()).status_code == 200)

        # --- withdraw: flips flag + re-blocks upload ---
        w = client.post("/monitoring/patients/1/consent/withdraw", headers=bearer(alice))
        check("withdraw -> 200 + consent_given false + withdrawn>=1",
              w.status_code == 200 and w.json()["consent_given"] is False
              and w.json()["withdrawn"] >= 1)
        check("computed flag now False", patient_flag(1) is False)
        check("no active consents remain", active_consent_count(1) == 0)
        check("alice upload after withdraw -> 403",
              client.post("/risk-assessment/upload/1", headers=bearer(alice),
                          files=fake_image()).status_code == 403)

        # --- re-consent with a new version unblocks again ---
        client.post("/monitoring/patients/1/consent", headers=bearer(alice),
                    json={"consent_text_version": "v2.0", "consent_text_snapshot": "Новая версия."})
        check("re-consent (v2.0) unblocks upload -> 200",
              client.post("/risk-assessment/upload/1", headers=bearer(alice),
                          files=fake_image()).status_code == 200)
        check("exactly one active consent after re-consent", active_consent_count(1) == 1)

        # --- patient 2 never consented -> still blocked ---
        check("patient 2 upload still blocked -> 403",
              client.post("/risk-assessment/upload/2", headers=bearer(bob),
                          files=fake_image()).status_code == 403)

        # --- access control on consent endpoints ---
        check("bob recording consent for patient 1 -> 403 (ownership)",
              client.post("/monitoring/patients/1/consent", headers=bearer(bob),
                          json={"consent_text_version": "x", "consent_text_snapshot": "x"}).status_code == 403)
        check("no token recording consent -> 401",
              client.post("/monitoring/patients/1/consent",
                          json={"consent_text_version": "x", "consent_text_snapshot": "x"}).status_code == 401)
        check("doc consent for missing patient 999 -> 404",
              client.post("/monitoring/patients/999/consent", headers=bearer(doc),
                          json={"consent_text_version": "x", "consent_text_snapshot": "x"}).status_code == 404)

    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


def _snapshot_ok(patient_id: int, version: str, snapshot: str) -> bool:
    db = SessionLocal()
    try:
        rec = (
            db.query(ConsentRecord)
            .filter(ConsentRecord.patient_id == patient_id,
                    ConsentRecord.withdrawn_at.is_(None))
            .first()
        )
        return rec is not None and rec.consent_text_version == version \
            and rec.consent_text_snapshot == snapshot
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
