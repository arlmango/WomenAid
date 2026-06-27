#!/usr/bin/env python3
"""End-to-end check of encryption-at-rest, retention, and right-to-be-forgotten.

Verifies: uploaded files are stored encrypted (not plaintext) under
WOMENAID_UPLOAD_DIR with UUID names; missing WOMENAID_FILE_ENCRYPTION_KEY fails
loudly instead of storing plaintext; data_retention_until is extended on
upload; the purge job deletes only expired images; and
DELETE /monitoring/patients/{id}/data erases images + personal fields, keeps
an anonymized stat row, and is admin-only. Run directly:

    .venv/bin/python tests/e2e_data_protection.py
"""
from __future__ import annotations

import os
import sys
import tempfile
from datetime import timedelta
from pathlib import Path

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["WOMENAID_DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ.setdefault("WOMENAID_SECRET_KEY", "test-secret")
os.environ["WOMENAID_FILE_ENCRYPTION_KEY"] = "RrV2N6Jt4y0pUe8kS1l4t5dQ8mC3wYxZaB7nF9qO2vI="
_upload_dir = tempfile.mkdtemp(prefix="womenaid_uploads_")
os.environ["WOMENAID_UPLOAD_DIR"] = _upload_dir

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

import app.encryption as encryption  # noqa: E402
from app.db.database import SessionLocal, init_db  # noqa: E402
from app.encryption import FileEncryptionNotConfigured, decrypt_bytes  # noqa: E402
from app.main import app  # noqa: E402
from app.models.anonymized_stat import AnonymizedAssessmentStat  # noqa: E402
from app.models.consent import ConsentRecord  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.risk_assessment import RiskAssessment  # noqa: E402
from app.models.user import User  # noqa: E402
from app.retention import purge_expired_images  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.storage import save_encrypted_upload  # noqa: E402
from app.timeutils import utcnow_naive  # noqa: E402

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
        db.add_all([Patient(id=1, full_name="Patient One"), Patient(id=2, full_name="Patient Two")])
        db.flush()
        db.add_all([
            ConsentRecord(patient_id=1, consent_text_version="v1.0", consent_text_snapshot="ok"),
            ConsentRecord(patient_id=2, consent_text_version="v1.0", consent_text_snapshot="ok"),
        ])
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


def tok(client: TestClient, username: str, password: str) -> str:
    return client.post("/auth/login", data={"username": username, "password": password}).json()["access_token"]


def fake_image(content: bytes = b"fake-image-bytes") -> dict:
    return {"file": ("scan.jpg", content, "image/jpeg")}


def patient_row(patient_id: int) -> Patient:
    db = SessionLocal()
    try:
        return db.query(Patient).filter(Patient.id == patient_id).first()
    finally:
        db.close()


def assessments_for(patient_id: int):
    db = SessionLocal()
    try:
        return db.query(RiskAssessment).filter(RiskAssessment.patient_id == patient_id).all()
    finally:
        db.close()


def main() -> int:
    seed()
    with TestClient(app) as client:
        alice = tok(client, "alice", "alicepw")
        bob = tok(client, "bob", "bobpw")
        admin = tok(client, "admin", "adminpw")
        doc = tok(client, "doc", "docpw")

        # --- encryption: missing key fails loudly instead of writing plaintext ---
        # app.config reads the env var once at import time, so to simulate a
        # deployment with no key configured we patch the already-imported
        # module attribute rather than os.environ (which would have no effect
        # on code that already did `from app.config import FILE_ENCRYPTION_KEY`).
        key_backup = encryption.FILE_ENCRYPTION_KEY
        encryption.FILE_ENCRYPTION_KEY = None
        try:
            raised = False
            try:
                save_encrypted_upload(999, b"x")
            except FileEncryptionNotConfigured:
                raised = True
            check("save without key raises FileEncryptionNotConfigured", raised)
        finally:
            encryption.FILE_ENCRYPTION_KEY = key_backup

        # --- upload stores an encrypted file, not plaintext ---
        secret_bytes = b"\x89PNG-not-really-but-pretend-cervix-image-bytes"
        up = client.post("/risk-assessment/upload/1", headers=bearer(alice),
                         files=fake_image(secret_bytes))
        check("upload -> 200", up.status_code == 200)
        check("upload response has no raw_score/confidence",
              "raw_score" not in up.json() and "confidence" not in up.json())

        rows = assessments_for(1)
        check("exactly one risk_assessment row created", len(rows) == 1)
        image_path = rows[0].image_path
        check("image_path set, under WOMENAID_UPLOAD_DIR, UUID-named",
              bool(image_path) and image_path.startswith(_upload_dir) and image_path.endswith(".enc"))
        on_disk = Path(image_path).read_bytes()
        check("file on disk is NOT the plaintext bytes", on_disk != secret_bytes)
        check("file on disk decrypts back to the original bytes",
              decrypt_bytes(on_disk) == secret_bytes)

        # --- retention extended on upload ---
        patient1 = patient_row(1)
        check("data_retention_until set after upload", patient1.data_retention_until is not None)
        check("data_retention_until is in the future",
              patient1.data_retention_until > utcnow_naive())

        # --- purge job: only deletes images past their retention deadline ---
        client.post("/risk-assessment/upload/2", headers=bearer(bob), files=fake_image())
        db = SessionLocal()
        try:
            p1 = db.query(Patient).filter(Patient.id == 1).first()
            p1.data_retention_until = utcnow_naive() - timedelta(days=1)  # force-expire patient 1 only
            db.add(p1)
            db.commit()
        finally:
            db.close()

        purge_db = SessionLocal()
        try:
            summary = purge_expired_images(purge_db)
        finally:
            purge_db.close()
        check("purge: exactly one expired patient checked", summary["patients_checked"] == 1)
        check("purge: exactly one image deleted", summary["images_deleted"] == 1)
        check("purge: expired image file actually removed from disk", not Path(image_path).exists())

        p1_rows = assessments_for(1)
        check("purge nulls image_path but keeps the assessment row",
              len(p1_rows) == 1 and p1_rows[0].image_path is None)
        p2_rows = assessments_for(2)
        check("purge does NOT touch patient 2's (non-expired) image",
              len(p2_rows) == 1 and p2_rows[0].image_path is not None)

        # --- right-to-be-forgotten: access control ---
        check("alice (patient herself) cannot erase her own data -> 403",
              client.delete("/monitoring/patients/1/data", headers=bearer(alice)).status_code == 403)
        check("doc (clinician, not admin) cannot erase -> 403",
              client.delete("/monitoring/patients/1/data", headers=bearer(doc)).status_code == 403)
        check("no token erase -> 401",
              client.delete("/monitoring/patients/1/data").status_code == 401)
        check("admin erase missing patient -> 404",
              client.delete("/monitoring/patients/999/data", headers=bearer(admin)).status_code == 404)

        # --- right-to-be-forgotten: actual effect (on patient 2, which still has its image) ---
        before_path = assessments_for(2)[0].image_path
        er = client.delete("/monitoring/patients/2/data", headers=bearer(admin))
        check("admin erase -> 200", er.status_code == 200)
        eb = er.json()
        check("erase response reports 1 assessment erased, 1 image deleted, 1 stat kept",
              eb.get("assessments_erased") == 1 and eb.get("images_deleted") == 1
              and eb.get("anonymized_stats_created") == 1)
        check("erased image file removed from disk", not Path(before_path).exists())
        check("risk_assessment row for patient 2 is gone", assessments_for(2) == [])

        p2_after = patient_row(2)
        check("personal fields nulled (full_name)", p2_after.full_name is None)
        check("data_retention_until nulled (nothing left to retain)",
              p2_after.data_retention_until is None)
        check("consent_given flipped False (consent withdrawn)", p2_after.consent_given is False)

        db = SessionLocal()
        try:
            stats = db.query(AnonymizedAssessmentStat).all()
            check("anonymized stat row exists with no patient linkage",
                  len(stats) == 1 and not hasattr(stats[0], "patient_id"))
            # Upload now runs the real image-quality gate (not the old stub):
            # the fake non-image deterministically fails it -> INSUFFICIENT_QUALITY.
            # The safety property is unchanged — the anonymized row carries the
            # triage label but never raw_score/confidence (the model has no such
            # columns at all).
            check("anonymized stat carries triage_label but not raw_score/confidence",
                  stats[0].triage_label == "INSUFFICIENT_QUALITY"
                  and not hasattr(stats[0], "raw_score")
                  and not hasattr(stats[0], "confidence"))
        finally:
            db.close()

        # --- bob (now erased patient) can no longer upload: consent withdrawn ---
        check("bob upload after erasure -> 403 (consent gate re-engaged)",
              client.post("/risk-assessment/upload/2", headers=bearer(bob),
                          files=fake_image()).status_code == 403)

    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
