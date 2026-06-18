#!/usr/bin/env python3
"""Create a WomenAId user from the console (for demo accounts).

Examples (run from the repo root, with the venv active):
    python scripts/create_user.py --username admin    --role admin    --password adminpw
    python scripts/create_user.py --username doc       --role clinician --password docpw
    python scripts/create_user.py --username alice      --role patient   --password alicepw --full-name "Alice A."
    python scripts/create_user.py --username bob        --role patient   --patient-id 1

For role=patient: if --patient-id is given it must already exist; otherwise a
new patients row is created (optionally with --full-name) and linked.
"""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

# Allow running from the repo root: make the backend package importable.
BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app.db.database import SessionLocal, init_db  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.user import ROLES, User  # noqa: E402
from app.security import hash_password  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a WomenAId user")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", help="If omitted, you are prompted securely")
    parser.add_argument("--role", required=True, choices=sorted(ROLES))
    parser.add_argument(
        "--patient-id", type=int, default=None,
        help="Existing patients.id to link (role=patient only)",
    )
    parser.add_argument(
        "--full-name", default=None,
        help="Name for a newly created patient (role=patient, no --patient-id)",
    )
    args = parser.parse_args()

    password = args.password or getpass.getpass("Password: ")
    if not password:
        parser.error("password must not be empty")

    init_db()
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == args.username).first():
            print(f"error: user '{args.username}' already exists", file=sys.stderr)
            return 1

        patient_id = args.patient_id
        if args.role == "patient":
            if patient_id is None:
                patient = Patient(full_name=args.full_name)
                db.add(patient)
                db.flush()
                patient_id = patient.id
                print(f"created patient id={patient_id}")
            elif not db.query(Patient).filter(Patient.id == patient_id).first():
                print(f"error: patient id={patient_id} not found", file=sys.stderr)
                return 1
        elif patient_id is not None:
            print("warning: --patient-id ignored for non-patient role", file=sys.stderr)
            patient_id = None

        user = User(
            username=args.username,
            hashed_password=hash_password(password),
            role=args.role,
            patient_id=patient_id,
        )
        db.add(user)
        db.commit()
        print(f"created user '{args.username}' (role={args.role}, patient_id={patient_id})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
