"""Assessment PDF report generation (reportlab).

Renders a one-page clinic report. Uses a Cyrillic-capable TTF if one is found
(reportlab's built-in Helvetica has no Cyrillic glyphs); the path can be
overridden via WOMENAID_PDF_FONT. Falls back to Helvetica (Latin only) if none
is found — Russian text would then not render, so a real deployment should ship
a bundled font.
"""
from __future__ import annotations

import io
import os
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

DISCLAIMER = (
    "Документ сформирован AI-системой поддержки принятия решений. "
    "Не является диагнозом. Требует подтверждения врача."
)

_FONT_CANDIDATES = [
    os.environ.get("WOMENAID_PDF_FONT"),
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
_BODY_FONT = "Helvetica"
_font_ready = False


def _font() -> str:
    """Register and return a Cyrillic-capable font (cached)."""
    global _BODY_FONT, _font_ready
    if not _font_ready:
        for path in _FONT_CANDIDATES:
            if path and os.path.isfile(path):
                try:
                    pdfmetrics.registerFont(TTFont("WAReport", path))
                    _BODY_FONT = "WAReport"
                    break
                except Exception:
                    continue
        _font_ready = True
    return _BODY_FONT


def _needs_validation_warning(model_status: Optional[str]) -> bool:
    """Big warning unless the model is explicitly clinically validated."""
    s = (model_status or "").upper()
    return (not s) or ("NOT" in s) or ("DEMO" in s)


def _wrapped(c, font, size, text, x, y, max_width, leading=None):
    leading = leading or size * 1.3
    c.setFont(font, size)
    line = ""
    for word in (text or "").split():
        trial = (line + " " + word).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            c.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def build_assessment_report_pdf(
    *,
    assessment_id: int,
    patient_id: int,
    display_name: str,
    age,
    image_date: str,
    model_version: str,
    model_status: str,
    triage_label: str,
    confidence: Optional[float],
    clinician_decision: Optional[str] = None,
) -> bytes:
    buf = io.BytesIO()
    # pageCompression=0 keeps content streams readable (handy for inspection/tests).
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=0)
    c.setTitle(f"WomenAId report {assessment_id}")
    font = _font()
    width, height = A4
    margin = 2 * cm
    y = height - margin

    # --- Title ---
    c.setFont(font, 18)
    c.drawString(margin, y, "Отчёт AI-триажа шейки матки")
    y -= 0.7 * cm
    c.setFont(font, 10)
    c.setFillColor(colors.grey)
    c.drawString(margin, y, f"Risk Assessment Report · ID отчёта: {assessment_id}")
    c.setFillColor(colors.black)
    y -= 1.1 * cm

    # --- Patient ---
    c.setFont(font, 13)
    c.drawString(margin, y, "Пациентка")
    y -= 0.65 * cm
    c.setFont(font, 11)
    for line in (
        f"ФИО (display_name): {display_name}",
        f"Возраст: {age}",
        f"ID пациентки: {patient_id}",
    ):
        c.drawString(margin + 0.5 * cm, y, line)
        y -= 0.55 * cm
    y -= 0.3 * cm

    # --- Snapshot / model ---
    c.setFont(font, 11)
    c.drawString(margin, y, f"Дата снимка: {image_date}")
    y -= 0.55 * cm
    c.drawString(margin, y, f"Версия модели (model_version): {model_version}")
    y -= 1.0 * cm

    # --- Model status: prominent, not fine print ---
    if _needs_validation_warning(model_status):
        box_h = 1.5 * cm
        c.setFillColor(colors.HexColor("#B00020"))
        c.rect(margin, y - box_h + 0.45 * cm, width - 2 * margin, box_h, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(font, 14)
        c.drawString(margin + 0.4 * cm, y - 0.05 * cm, f"СТАТУС МОДЕЛИ: {model_status}")
        c.setFont(font, 9.5)
        c.drawString(
            margin + 0.4 * cm, y - 0.6 * cm,
            "Модель НЕ прошла клиническую валидацию — только для демонстрации.",
        )
        c.setFillColor(colors.black)
        y -= (box_h + 0.6 * cm)
    else:
        c.setFont(font, 12)
        c.drawString(margin, y, f"Статус модели (model_status): {model_status}")
        y -= 1.0 * cm

    # --- Triage + confidence ---
    c.setFont(font, 14)
    c.drawString(margin, y, f"Триаж-категория (triage_label): {triage_label}")
    y -= 0.7 * cm
    conf = "—" if confidence is None else f"{confidence:.0%}"
    c.setFont(font, 11)
    c.drawString(margin, y, f"Confidence (для врача): {conf}")
    y -= 1.1 * cm

    # --- Clinician decision ---
    c.setFont(font, 13)
    c.drawString(margin, y, "Решение врача (clinician_decision):")
    y -= 0.7 * cm
    if clinician_decision:
        y = _wrapped(c, font, 11, clinician_decision, margin + 0.5 * cm, y,
                     width - 2 * margin - 0.5 * cm, leading=0.55 * cm)
    else:
        for _ in range(2):
            c.line(margin + 0.5 * cm, y, width - margin, y)
            y -= 0.85 * cm

    # --- Disclaimer at the bottom of the page ---
    c.setFont(font, 9)
    c.setFillColor(colors.grey)
    _wrapped(c, font, 9, DISCLAIMER, margin, 2.0 * cm, width - 2 * margin, leading=0.45 * cm)
    c.setFillColor(colors.black)

    c.showPage()
    c.save()
    return buf.getvalue()
