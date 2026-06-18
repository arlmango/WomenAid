#!/usr/bin/env python3
"""End-to-end check of GET /risk-assessment/clinic/{id}/report.pdf.

Verifies: a valid PDF is produced; it contains the required fields; the
model-status warning is prominent when the model is not validated and absent
when it is; a filled clinician_decision is shown and an empty one is not
fabricated; 404 on missing; access control (clinician/admin only). Run:

    .venv/bin/python tests/e2e_report.py
"""
from __future__ import annotations

import io
import os
import sys
import tempfile
from datetime import date
from pathlib import Path

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["WOMENAID_DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ.setdefault("WOMENAID_SECRET_KEY", "test-secret")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient  # noqa: E402
from pypdf import PdfReader  # noqa: E402

from app.db.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.audit import AuditLog  # noqa: E402
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


# assessment ids captured at seed time
A_URGENT = A_ROUTINE = A_VALIDATED = None


def seed() -> None:
    global A_URGENT, A_ROUTINE, A_VALIDATED
    init_db()
    db = SessionLocal()
    try:
        p = Patient(id=1, full_name="Жанна Тулегенова", birth_date=date(1971, 1, 1))
        db.add(p)
        db.flush()
        db.add_all([
            User(username="admin", hashed_password=hash_password("adminpw"), role="admin"),
            User(username="doc", hashed_password=hash_password("docpw"), role="clinician"),
            User(username="alice", hashed_password=hash_password("alicepw"),
                 role="patient", patient_id=1),
        ])
        a1 = RiskAssessment(patient_id=1, triage_label="URGENT_REVIEW", confidence=0.83,
                            model_version="demo-rf-0.0", model_status="NOT_CLINICALLY_VALIDATED",
                            clinician_decision="Срочно направлена на кольпоскопию.")
        a2 = RiskAssessment(patient_id=1, triage_label="ROUTINE_FOLLOWUP", confidence=0.12,
                            model_version="demo-rf-0.0", model_status="NOT_CLINICALLY_VALIDATED")
        a3 = RiskAssessment(patient_id=1, triage_label="PRIORITY_REVIEW", confidence=0.50,
                            model_version="rf-1.0", model_status="CLINICALLY_VALIDATED")
        db.add_all([a1, a2, a3])
        db.commit()
        A_URGENT, A_ROUTINE, A_VALIDATED = a1.id, a2.id, a3.id
    finally:
        db.close()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def tok(client: TestClient, u: str, p: str) -> str:
    return client.post("/auth/login", data={"username": u, "password": p}).json()["access_token"]


def pdf_text(content: bytes) -> str:
    return "\n".join(page.extract_text() for page in PdfReader(io.BytesIO(content)).pages)


def main() -> int:
    seed()
    with TestClient(app) as client:
        doc = tok(client, "doc", "docpw")
        admin = tok(client, "admin", "adminpw")
        alice = tok(client, "alice", "alicepw")

        url = f"/risk-assessment/clinic/{A_URGENT}/report.pdf"

        # --- access control ---
        check("no token -> 401", client.get(url).status_code == 401)
        check("patient -> 403", client.get(url, headers=bearer(alice)).status_code == 403)

        # --- clinician: valid PDF ---
        r = client.get(url, headers=bearer(doc))
        check("clinician -> 200", r.status_code == 200)
        check("content-type application/pdf", r.headers.get("content-type") == "application/pdf")
        check("body is a PDF (%PDF)", r.content[:4] == b"%PDF")
        check("Content-Disposition filename present",
              "assessment-" in r.headers.get("content-disposition", ""))
        check("admin -> 200", client.get(url, headers=bearer(admin)).status_code == 200)

        text = pdf_text(r.content)
        check("PDF: patient display_name", "Жанна" in text)
        check("PDF: patient age", "55" in text)
        check("PDF: triage_label", "URGENT_REVIEW" in text)
        check("PDF: model_version", "demo-rf-0.0" in text)
        check("PDF: confidence shown", "83%" in text)
        check("PDF: model_status prominent", "NOT_CLINICALLY_VALIDATED" in text)
        check("PDF: prominent not-validated warning",
              "НЕ прошла клиническую валидацию" in text)
        check("PDF: filled clinician_decision shown", "кольпоскопию" in text)
        check("PDF: disclaimer present", "Не является диагнозом" in text)

        # --- empty clinician_decision: not fabricated ---
        r2 = client.get(f"/risk-assessment/clinic/{A_ROUTINE}/report.pdf", headers=bearer(doc))
        t2 = pdf_text(r2.content)
        check("empty-decision report -> 200 PDF", r2.status_code == 200 and r2.content[:4] == b"%PDF")
        check("empty-decision: triage shown", "ROUTINE_FOLLOWUP" in t2)
        check("empty-decision: no fabricated decision text", "кольпоскопию" not in t2)

        # --- validated model: no big warning ---
        r3 = client.get(f"/risk-assessment/clinic/{A_VALIDATED}/report.pdf", headers=bearer(doc))
        t3 = pdf_text(r3.content)
        check("validated: status shown", "CLINICALLY_VALIDATED" in t3)
        check("validated: NO not-validated warning",
              "НЕ прошла клиническую валидацию" not in t3)

        # --- 404 ---
        check("missing assessment -> 404",
              client.get("/risk-assessment/clinic/999999/report.pdf", headers=bearer(doc)).status_code == 404)

    # --- audit trail recorded ---
    db = SessionLocal()
    try:
        n = db.query(AuditLog).filter(AuditLog.action == "generate_report_pdf").count()
        check("audit: generate_report_pdf logged", n >= 3)
    finally:
        db.close()

    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
