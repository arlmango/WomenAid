#!/usr/bin/env python3
"""End-to-end check of the WomenAId audit log + /admin/audit-log endpoint.

Spins up the app against an isolated temp SQLite DB, performs auditable actions,
then verifies the audit trail and the admin-only query endpoint (filters +
access control). Run directly:

    .venv/bin/python tests/e2e_audit.py
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
from app.models.patient import Patient  # noqa: E402
from app.models.risk_assessment import RiskAssessment  # noqa: E402
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
        db.add(RiskAssessment(id=55, patient_id=1, triage_label="PENDING_REVIEW"))
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


def token(client: TestClient, username: str, password: str) -> str:
    return client.post("/auth/login",
                       data={"username": username, "password": password}).json()["access_token"]


def main() -> int:
    seed()
    with TestClient(app) as client:
        alice = token(client, "alice", "alicepw")
        doc = token(client, "doc", "docpw")
        admin = token(client, "admin", "adminpw")

        # --- generate auditable actions ---
        check("doc views clinic queue -> 200",
              client.get("/risk-assessment/clinic/queue", headers=bearer(doc)).status_code == 200)
        check("doc views patient 1 card -> 200",
              client.get("/monitoring/patients/1", headers=bearer(doc)).status_code == 200)
        rev = client.post("/risk-assessment/clinic/review/55",
                          headers=bearer(doc),
                          json={"decision": "PRIORITY_REVIEW", "patient_id": 1, "note": "follow up"})
        check("doc reviews assessment 55 -> 200", rev.status_code == 200)
        c1 = client.post("/monitoring/patients/1/consent", headers=bearer(alice),
                         json={"consent_text_version": "v1.0",
                               "consent_text_snapshot": "Я согласна на AI-обработку"})
        check("alice records consent -> 200 + consent_given true",
              c1.status_code == 200 and c1.json()["consent_given"] is True)
        c2 = client.post("/monitoring/patients/1/consent/withdraw", headers=bearer(alice))
        check("alice withdraws consent -> 200 + consent_given false",
              c2.status_code == 200 and c2.json()["consent_given"] is False)

        # --- access control on the audit endpoint ---
        check("no token audit-log -> 401", client.get("/admin/audit-log").status_code == 401)
        check("clinician audit-log -> 403",
              client.get("/admin/audit-log", headers=bearer(doc)).status_code == 403)
        check("patient audit-log -> 403",
              client.get("/admin/audit-log", headers=bearer(alice)).status_code == 403)

        # --- admin reads the full log ---
        r = client.get("/admin/audit-log", headers=bearer(admin))
        check("admin audit-log -> 200", r.status_code == 200)
        rows = r.json()
        actions = {row["action"] for row in rows}
        check("logged: view_clinic_queue", "view_clinic_queue" in actions)
        check("logged: view_patient_card", "view_patient_card" in actions)
        check("logged: review_assessment", "review_assessment" in actions)
        check("logged: consent.given", "consent.given" in actions)
        check("logged: consent.withdrawn", "consent.withdrawn" in actions)
        check("every row carries actor_role",
              all(row.get("actor_role") in ("admin", "clinician", "patient") for row in rows))
        review_rows = [row for row in rows if row["action"] == "review_assessment"]
        check("review row records decision + patient_id in details",
              bool(review_rows) and "PRIORITY_REVIEW" in (review_rows[0]["details"] or "")
              and "55" == str(review_rows[0]["target_id"]))
        check("newest-first ordering",
              [row["id"] for row in rows] == sorted((row["id"] for row in rows), reverse=True))

        # --- filter by patient_id ---
        pr = client.get("/admin/audit-log", headers=bearer(admin), params={"patient_id": 1}).json()
        check("patient_id=1 returns only patient-targeted rows",
              bool(pr) and all(row["target_type"] == "patient" and row["target_id"] == 1 for row in pr))
        pr_actions = {row["action"] for row in pr}
        check("patient_id filter includes card view + consent",
              {"view_patient_card", "consent.given", "consent.withdrawn"} <= pr_actions)
        check("patient_id filter excludes queue/review (non-patient targets)",
              "view_clinic_queue" not in pr_actions and "review_assessment" not in pr_actions)
        check("patient_id=2 has no rows (no actions on patient 2)",
              client.get("/admin/audit-log", headers=bearer(admin),
                         params={"patient_id": 2}).json() == [])

        # --- filter by date range ---
        check("future start -> empty",
              client.get("/admin/audit-log", headers=bearer(admin),
                         params={"start": "2999-01-01"}).json() == [])
        check("wide range -> non-empty",
              len(client.get("/admin/audit-log", headers=bearer(admin),
                             params={"start": "2000-01-01", "end": "2999-01-01"}).json()) > 0)
        check("past-only end -> empty",
              client.get("/admin/audit-log", headers=bearer(admin),
                         params={"end": "2000-01-01"}).json() == [])

    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
