#!/usr/bin/env python3
"""End-to-end check of the WomenAId access-control layer.

There was no pre-existing E2E scenario in the repo, so this is a new, self-
contained smoke test of the auth requirements. It spins up the FastAPI app
against an isolated temp SQLite DB, seeds four users, and asserts every
access-control rule from the task. Run it directly:

    .venv/bin/python tests/e2e_auth.py
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

# Use an isolated temp DB — must be set BEFORE importing app config/db.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["WOMENAID_DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ.setdefault("WOMENAID_SECRET_KEY", "test-secret")
os.environ.setdefault("WOMENAID_FILE_ENCRYPTION_KEY",
                       "1v04AMn8hI_MvkCGoUP37GeIsWkqqJ1WxS25Kf5hN6U=")
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
        # Upload is consent-gated; give both patients active consent so this
        # suite exercises access control (roles/ownership), not the consent gate.
        db.add_all([
            ConsentRecord(patient_id=1, consent_text_version="v1.0",
                          consent_text_snapshot="test consent"),
            ConsentRecord(patient_id=2, consent_text_version="v1.0",
                          consent_text_snapshot="test consent"),
        ])
        db.commit()
    finally:
        db.close()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def fake_image() -> dict:
    return {"file": ("scan.jpg", b"fake-image-bytes", "image/jpeg")}


def login(client: TestClient, username: str, password: str):
    return client.post("/auth/login", data={"username": username, "password": password})


def main() -> int:
    seed()
    with TestClient(app) as client:
        # --- login ---
        r = login(client, "alice", "alicepw")
        check("alice login -> 200", r.status_code == 200)
        alice = r.json()["access_token"]
        bob = login(client, "bob", "bobpw").json()["access_token"]
        doc = login(client, "doc", "docpw").json()["access_token"]
        admin = login(client, "admin", "adminpw").json()["access_token"]
        check("wrong password -> 401", login(client, "alice", "nope").status_code == 401)
        check("unknown user -> 401", login(client, "ghost", "x").status_code == 401)

        # --- unauthenticated is rejected ---
        check("no token clinic queue -> 401",
              client.get("/risk-assessment/clinic/queue").status_code == 401)
        check("no token upload -> 401",
              client.post("/risk-assessment/upload/1", files=fake_image()).status_code == 401)
        check("no token patient monitoring -> 401",
              client.get("/monitoring/patients/1/symptoms").status_code == 401)

        # --- patient accessing their OWN data -> 200 ---
        up = client.post("/risk-assessment/upload/1", headers=bearer(alice), files=fake_image())
        check("alice upload own patient -> 200", up.status_code == 200)
        body = up.json()
        check("patient response leaks no raw_score/confidence",
              "raw_score" not in body and "confidence" not in body)
        check("patient response has triage_label+message+disclaimer",
              all(k in body for k in ("triage_label", "patient_facing_message", "disclaimer")))
        check("alice monitoring own -> 200",
              client.get("/monitoring/patients/1/symptoms", headers=bearer(alice)).status_code == 200)

        # --- patient accessing ANOTHER patient -> 403 ---
        check("alice upload other patient -> 403",
              client.post("/risk-assessment/upload/2", headers=bearer(alice),
                          files=fake_image()).status_code == 403)
        check("alice monitoring other patient -> 403",
              client.get("/monitoring/patients/2/symptoms", headers=bearer(alice)).status_code == 403)
        check("bob monitoring other patient -> 403",
              client.get("/monitoring/patients/1/schedule", headers=bearer(bob)).status_code == 403)

        # --- patient hitting clinic-only endpoints -> 403 ---
        check("alice clinic queue -> 403",
              client.get("/risk-assessment/clinic/queue", headers=bearer(alice)).status_code == 403)
        check("alice clinic monitoring -> 403",
              client.get("/monitoring/clinic/overview", headers=bearer(alice)).status_code == 403)

        # --- clinician access ---
        check("doc clinic queue -> 200",
              client.get("/risk-assessment/clinic/queue", headers=bearer(doc)).status_code == 200)
        check("doc any patient monitoring -> 200",
              client.get("/monitoring/patients/2/symptoms", headers=bearer(doc)).status_code == 200)
        check("doc upload any patient -> 200",
              client.post("/risk-assessment/upload/2", headers=bearer(doc),
                          files=fake_image()).status_code == 200)

        # --- admin access ---
        check("admin clinic overview -> 200",
              client.get("/monitoring/clinic/overview", headers=bearer(admin)).status_code == 200)
        check("admin any patient -> 200",
              client.get("/monitoring/patients/1/schedule", headers=bearer(admin)).status_code == 200)

    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
