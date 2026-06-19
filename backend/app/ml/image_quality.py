"""Real, deterministic photo-quality gate for uploaded risk-assessment images.

This is NOT an AI triage model — it never looks at clinical content and never
produces a triage category. It only answers "is this photo usable" (readable,
big enough, not too dark/bright/blurry) using classical image statistics
(Pillow's ImageStat on grayscale/edge-filtered pixels). That is the honest
v0 for the upload endpoint: see app/routers/risk_assessment.py — a real
working AI classifier does not exist yet (app/ml/train.py fits on synthetic
random noise, not real images, and is intentionally not wired to serving).

⚠️  Thresholds below are reasonable defaults for "is this a usable photo",
NOT clinically derived. They never gate on clinical findings — only on
generic photographic readability — so they don't run into the CLAUDE.md
stop-signal around triage/diagnosis logic.
"""
from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Optional

from PIL import Image, ImageFilter, ImageStat

MIN_DIMENSION_PX = 200
MIN_BRIGHTNESS = 30.0   # mean grayscale 0-255; below this reads as "too dark"
MAX_BRIGHTNESS = 225.0  # above this reads as "blown out / too bright"
MIN_EDGE_STDDEV = 4.0   # edge-intensity variability; below this reads as "too blurry"


@dataclass
class ImageQualityResult:
    passed: bool
    reason: Optional[str]  # one of: too_small, unreadable, too_dark, too_bright, too_blurry
    width: Optional[int] = None
    height: Optional[int] = None
    brightness_mean: Optional[float] = None
    edge_stddev: Optional[float] = None


def assess_image_quality(data: bytes) -> ImageQualityResult:
    """Run real (non-fabricated) photo-quality checks on raw upload bytes."""
    try:
        image = Image.open(io.BytesIO(data))
        image.load()  # force decode now so truncated/corrupt files fail here
    except Exception:
        return ImageQualityResult(passed=False, reason="unreadable")

    width, height = image.size
    if width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX:
        return ImageQualityResult(
            passed=False, reason="too_small", width=width, height=height
        )

    grayscale = image.convert("L")
    brightness_mean = ImageStat.Stat(grayscale).mean[0]

    edges = grayscale.filter(ImageFilter.FIND_EDGES)
    edge_stddev = ImageStat.Stat(edges).stddev[0]

    if brightness_mean < MIN_BRIGHTNESS:
        reason = "too_dark"
    elif brightness_mean > MAX_BRIGHTNESS:
        reason = "too_bright"
    elif edge_stddev < MIN_EDGE_STDDEV:
        reason = "too_blurry"
    else:
        reason = None

    return ImageQualityResult(
        passed=reason is None,
        reason=reason,
        width=width,
        height=height,
        brightness_mean=round(brightness_mean, 2),
        edge_stddev=round(edge_stddev, 2),
    )
