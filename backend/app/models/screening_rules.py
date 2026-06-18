"""Clinical screening rules.

⚠️  PLACEHOLDER CLINICAL VALUES — NOT CLINICALLY VALIDATED.

The thresholds below (eligibility ages, screening interval, due-soon window) and
the RED_FLAG_SYMPTOMS list are DEMO placeholders so the demo/seed can produce
plausible cases. They have NOT been authored or signed off with the clinical
team. Per CLAUDE.md, this is a stop-signal area: real values must be set with
clinicians before any pilot. Treat everything here as demo-synthetic, like
dataset_status=DEMO_SYNTHETIC_NOT_CLINICAL.

Invariants that are NOT placeholders (must always hold):
  - A red-flag symptom ALWAYS yields a "see a doctor" recommendation,
    regardless of AI output or screening schedule.
  - No recommendation here ever means "you are healthy, no doctor needed".
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import List, Optional

# --- Screening status values ---
NOT_YET_ELIGIBLE = "NOT_YET_ELIGIBLE"
OUT_OF_PROGRAM_AGE = "OUT_OF_PROGRAM_AGE"
OVERDUE = "OVERDUE"
DUE_SOON = "DUE_SOON"
UP_TO_DATE = "UP_TO_DATE"

SCREENING_STATUSES = {
    NOT_YET_ELIGIBLE,
    OUT_OF_PROGRAM_AGE,
    OVERDUE,
    DUE_SOON,
    UP_TO_DATE,
}

# --- PLACEHOLDER thresholds (NOT clinically validated) ---
MIN_ELIGIBLE_AGE = 30
MAX_ELIGIBLE_AGE = 65
SCREENING_INTERVAL_DAYS = 1096  # ~3 years
DUE_SOON_WINDOW_DAYS = 90  # flagged "due soon" within 90 days of the due date

# --- PLACEHOLDER red-flag list (NOT clinically validated) ---
# TODO(clinical): replace with the clinically authored list before pilot.
RED_FLAG_SYMPTOMS: List[str] = [
    "кровотечение после полового акта",
    "постменопаузальное кровотечение",
    "межменструальное кровотечение",
    "боль в области таза",
]


def age_years(birth_date: date, today: Optional[date] = None) -> int:
    today = today or date.today()
    return (
        today.year
        - birth_date.year
        - ((today.month, today.day) < (birth_date.month, birth_date.day))
    )


def get_screening_status(
    birth_date: Optional[date],
    last_screening_date: Optional[date],
    today: Optional[date] = None,
) -> str:
    """Derive screening status from age + last screening date.

    Branches: NOT_YET_ELIGIBLE / OUT_OF_PROGRAM_AGE / OVERDUE / DUE_SOON /
    UP_TO_DATE. Uses PLACEHOLDER thresholds (see module docstring).
    """
    today = today or date.today()

    if birth_date is None:
        # Unknown age — cannot place in program; treat as not-yet-eligible.
        return NOT_YET_ELIGIBLE

    age = age_years(birth_date, today)
    if age < MIN_ELIGIBLE_AGE:
        return NOT_YET_ELIGIBLE
    if age > MAX_ELIGIBLE_AGE:
        return OUT_OF_PROGRAM_AGE

    # Eligible by age: status depends on the last screening date.
    if last_screening_date is None:
        return OVERDUE  # in program but never screened

    next_due = last_screening_date + timedelta(days=SCREENING_INTERVAL_DAYS)
    if today > next_due:
        return OVERDUE
    if today >= next_due - timedelta(days=DUE_SOON_WINDOW_DAYS):
        return DUE_SOON
    return UP_TO_DATE


def evaluate_symptom(text: str) -> dict:
    """Classify a single symptom-diary entry.

    Red-flag (matches RED_FLAG_SYMPTOMS) ALWAYS recommends a doctor. A non-red-flag
    entry never implies "you are healthy" — only routine monitoring/screening.
    """
    lowered = (text or "").lower()
    is_red_flag = any(flag.lower() in lowered for flag in RED_FLAG_SYMPTOMS)
    recommendation = (
        "обратитесь к врачу"
        if is_red_flag
        else "наблюдать, плановый скрининг по графику"
    )
    return {"symptom": text, "is_red_flag": is_red_flag, "recommendation": recommendation}
