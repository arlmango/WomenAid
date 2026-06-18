#!/usr/bin/env python3
"""Seed plausible demo data for a live clinic demo — via the ORM (not the API).

Creates ~8 patients spanning every screening status, a few symptom-diary entries
(incl. red-flag cases), several risk assessments with different triage labels,
active consent for in-program patients, and demo logins (1 clinician + one user
per patient). Prints credentials and patient IDs at the end.

⚠️  Uses PLACEHOLDER, NOT-clinically-validated screening thresholds and red-flag
list (see app/models/screening_rules.py). Demo only.

Usage (from repo root, venv active):
    python scripts/seed_demo.py            # seed (refuses if already seeded)
    python scripts/seed_demo.py --reset    # drop & recreate all tables, then seed

Writes to the configured DB (WOMENAID_DATABASE_URL, default ./womenaid.db).
"""
from __future__ import annotations

import argparse
import sys
from datetime import date, timedelta
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app.consent import record_consent, sync_consent_flag  # noqa: E402
from app.db.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.risk_assessment import RiskAssessment, TRIAGE_LABELS  # noqa: E402
from app.models.screening_rules import (  # noqa: E402
    DUE_SOON,
    NOT_YET_ELIGIBLE,
    OUT_OF_PROGRAM_AGE,
    OVERDUE,
    UP_TO_DATE,
    age_years,
    evaluate_symptom,
    get_screening_status,
)
from app.models.symptom import SymptomEntry  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

TODAY = date.today()
DEMO_DOC_USERNAME = "demo_doc"
DEMO_PASSWORD = "demo1234"


def years_ago(n: float) -> date:
    return TODAY - timedelta(days=int(round(365.25 * n)))


def days_ago(n: int) -> date:
    return TODAY - timedelta(days=n)


# Each spec is dated relative to today so the computed status is stable.
PATIENT_SPECS = [
    {"name": "Айгуль Серикова", "birth": years_ago(41), "last": days_ago(365), "expect": UP_TO_DATE},
    {"name": "Бахыт Нурлан", "birth": years_ago(47), "last": days_ago(548), "expect": UP_TO_DATE},
    {"name": "Динара Касымова", "birth": years_ago(50), "last": days_ago(1051), "expect": DUE_SOON},
    {"name": "Гульнара Абенова", "birth": years_ago(38), "last": days_ago(1076), "expect": DUE_SOON},
    {"name": "Жанна Тулегенова", "birth": years_ago(55), "last": days_ago(1296), "expect": OVERDUE},
    {"name": "Сауле Ермекова", "birth": years_ago(60), "last": days_ago(1790), "expect": OVERDUE},
    {"name": "Лаура Жумаш", "birth": years_ago(24), "last": None, "expect": NOT_YET_ELIGIBLE},
    {"name": "Роза Бекова", "birth": years_ago(70), "last": days_ago(400), "expect": OUT_OF_PROGRAM_AGE},
]

# Symptom diary: (patient index, symptom text). Red-flag set by evaluate_symptom.
SYMPTOM_SPECS = [
    (2, "тянущие боли внизу живота после нагрузки"),
    (4, "кровотечение после полового акта"),       # red flag
    (4, "общая слабость и утомляемость"),
    (5, "постменопаузальное кровотечение"),         # red flag
]

# Risk assessments: (patient index, triage_label, raw_score, confidence, decision).
ASSESSMENT_SPECS = [
    (0, "ROUTINE_FOLLOWUP", 0.12, 0.88, None),
    (2, "PRIORITY_REVIEW", 0.67, 0.74, None),
    (4, "URGENT_REVIEW", 0.91, 0.83,
     "Срочно направлена на кольпоскопию; согласовано с онкогинекологом."),
    (7, "INSUFFICIENT_QUALITY", None, 0.21, None),
]


def seed(db) -> list:
    created = []
    for i, spec in enumerate(PATIENT_SPECS, start=1):
        patient = Patient(
            full_name=spec["name"],
            birth_date=spec["birth"],
            last_screening_date=spec["last"],
        )
        db.add(patient)
        db.flush()  # assign id

        status = get_screening_status(patient.birth_date, patient.last_screening_date, TODAY)
        assert status == spec["expect"], (
            f"{spec['name']}: expected {spec['expect']}, computed {status}"
        )

        # In-program patients get active consent (NOT_YET_ELIGIBLE stays unconsented
        # so the demo can also show the consent gate blocking AI upload).
        if status != NOT_YET_ELIGIBLE:
            record_consent(db, patient.id, "v1.0",
                           "Я согласна на AI-обработку снимка (демо-текст).")
            sync_consent_flag(db, patient)

        # Linked patient login.
        username = f"patient{i}"
        db.add(User(username=username, hashed_password=hash_password(DEMO_PASSWORD),
                    role="patient", patient_id=patient.id))

        # Capture plain values now — after commit/close the ORM objects detach.
        created.append({"id": patient.id, "name": spec["name"], "birth": spec["birth"],
                        "status": status, "username": username,
                        "symptoms": [], "assessment": None})

    # Symptoms.
    for idx, text in SYMPTOM_SPECS:
        verdict = evaluate_symptom(text)
        db.add(SymptomEntry(patient_id=created[idx]["id"], symptom_text=text,
                            is_red_flag=verdict["is_red_flag"]))
        created[idx]["symptoms"].append((text, verdict["is_red_flag"]))

    # Risk assessments (synthetic — no real image file).
    for idx, label, raw, conf, decision in ASSESSMENT_SPECS:
        assert label in TRIAGE_LABELS, f"bad triage label {label}"
        pid = created[idx]["id"]
        db.add(RiskAssessment(
            patient_id=pid,
            image_path=f"synthetic://demo/assessment-p{pid}.png",
            triage_label=label, raw_score=raw, confidence=conf,
            clinician_decision=decision,
        ))
        created[idx]["assessment"] = label

    # Demo clinician.
    db.add(User(username=DEMO_DOC_USERNAME, hashed_password=hash_password(DEMO_PASSWORD),
                role="clinician"))

    db.commit()
    return created


def report(created: list) -> None:
    print("\n" + "=" * 72)
    print("ДЕМО-ДАННЫЕ ЗАПОЛНЕНЫ")
    print("=" * 72)
    print("\n⚠️  PLACEHOLDER клинические значения (не валидированы) — только для демо.\n")
    print("Демо-врач (clinician):")
    print(f"    login:    {DEMO_DOC_USERNAME}")
    print(f"    password: {DEMO_PASSWORD}")
    print(f"\nПароль всех пациенток: {DEMO_PASSWORD}\n")

    header = f"{'ID':>3}  {'Пациентка':<20} {'Возр':>4}  {'Статус скрининга':<18} {'Симптомы':<14} {'Assessment':<18} {'Логин':<9}"
    print(header)
    print("-" * len(header))
    for row in created:
        age = age_years(row["birth"], TODAY)
        red = any(rf for _, rf in row["symptoms"])
        if row["symptoms"]:
            sym = f"{len(row['symptoms'])}" + (" RED-FLAG" if red else "")
        else:
            sym = "-"
        print(f"{row['id']:>3}  {row['name']:<20} {age:>4}  {row['status']:<18} "
              f"{sym:<14} {row['assessment'] or '-':<18} {row['username']:<9}")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed demo data via ORM")
    parser.add_argument("--reset", action="store_true",
                        help="Drop & recreate all tables before seeding")
    args = parser.parse_args()

    if args.reset:
        print("--reset: dropping and recreating all tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        init_db()

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == DEMO_DOC_USERNAME).first():
            print("Демо уже заполнено. Перезапустите с --reset, чтобы пересоздать.",
                  file=sys.stderr)
            return 1
        created = seed(db)
    finally:
        db.close()

    report(created)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
