"""Patient-facing triage messages — referenced by CLAUDE.md as the single
place safety-critical wording for the upload flow lives, so it gets
native-speaker / clinical review before ever changing.

Hard rule (CLAUDE.md): no message here may mean "you are healthy, no doctor
needed". `PENDING_REVIEW` and `INSUFFICIENT_QUALITY` are the only outcomes
this module can produce — there is no real AI classifier wired in yet (see
app/ml/image_quality.py's module docstring), so it never guesses
ROUTINE_FOLLOWUP / PRIORITY_REVIEW / URGENT_REVIEW. Those three labels are
still valid TRIAGE_LABELS values (clinicians can set them via review), they
are just never assigned by this module.
"""
from __future__ import annotations

from app.ml.image_quality import ImageQualityResult

DISCLAIMER = (
    "Это вспомогательная информация для маршрутизации (decision-support), "
    "а не медицинский диагноз. Модель не прошла клиническую валидацию. "
    "Окончательное решение принимает врач."
)

# Keyed by ImageQualityResult.reason. Each message tells the patient exactly
# what to fix and re-upload — never implies anything about health status.
_QUALITY_FAILURE_MESSAGES = {
    "unreadable": "Не удалось открыть файл как изображение. Пожалуйста, переснимите и загрузите снова.",
    "too_small": "Изображение слишком маленького размера. Пожалуйста, сделайте снимок заново ближе к камере.",
    "too_dark": "Снимок слишком тёмный. Пожалуйста, переснимите при хорошем освещении.",
    "too_bright": "Снимок переэкспонирован (слишком яркий/засвечен). Пожалуйста, переснимите.",
    "too_blurry": "Снимок нечёткий (не в фокусе). Пожалуйста, переснимите, не двигая камеру.",
}
_DEFAULT_QUALITY_MESSAGE = (
    "Снимок не прошёл проверку качества. Пожалуйста, переснимите и загрузите снова."
)

PENDING_REVIEW_MESSAGE = (
    "Снимок принят и направлен врачу на ревью. Результат появится после того, "
    "как врач его просмотрит — окончательное решение принимает врач, не AI-система."
)


def patient_message_for_quality_failure(quality: ImageQualityResult) -> str:
    return _QUALITY_FAILURE_MESSAGES.get(quality.reason or "", _DEFAULT_QUALITY_MESSAGE)
