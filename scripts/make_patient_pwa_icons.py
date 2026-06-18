#!/usr/bin/env python3
"""Generate the patient-PWA app icons (reproducible, no hand-edited binaries).

Draws a simple branded mark — a white "W" on the WomenAId brand-blue background —
at the sizes a PWA needs for the manifest, Android, and iOS "add to home screen":

    icons/icon-192.png            192x192  rounded, transparent corners
    icons/icon-512.png            512x512  rounded, transparent corners
    icons/icon-maskable-512.png   512x512  full-bleed (safe-zone aware) maskable
    icons/apple-touch-icon.png    180x180  full-bleed (iOS adds its own rounding)
    icons/favicon-32.png           32x32   small favicon

Run from the repo root:

    python scripts/make_patient_pwa_icons.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

BRAND_BLUE = (20, 86, 196, 255)   # #1456c4 — matches manifest theme_color
WHITE = (255, 255, 255, 255)
OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "patient-pwa" / "icons"


def _draw_w(draw: ImageDraw.ImageDraw, size: int, inset: float) -> None:
    """Stroke a clean 'W' centred in the icon, scaled to `size`.

    `inset` is the fraction of the canvas kept clear on each side — larger for
    maskable icons so the glyph stays inside the platform's safe zone.
    """
    left = size * inset
    right = size * (1 - inset)
    top = size * (inset + 0.06)
    bottom = size * (1 - inset - 0.06)
    span = right - left
    mid_x = (left + right) / 2
    mid_peak_y = top + (bottom - top) * 0.42

    points = [
        (left, top),
        (left + span * 0.22, bottom),
        (mid_x, mid_peak_y),
        (right - span * 0.22, bottom),
        (right, top),
    ]
    stroke = max(2, int(size * 0.085))
    draw.line(points, fill=WHITE, width=stroke, joint="curve")
    # Round the end-caps (line(joint="curve") only rounds interior joints).
    r = stroke / 2
    for (x, y) in (points[0], points[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=WHITE)


def _supersampled(size: int, rounded: bool, inset: float) -> Image.Image:
    """Render at 4x then downscale for smooth (anti-aliased) edges."""
    scale = 4
    big = size * scale
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        radius = int(big * 0.22)
        draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=radius, fill=BRAND_BLUE)
    else:
        draw.rectangle((0, 0, big - 1, big - 1), fill=BRAND_BLUE)
    _draw_w(draw, big, inset)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Standard manifest icons: rounded card, normal inset.
    _supersampled(192, rounded=True, inset=0.20).save(OUT_DIR / "icon-192.png")
    _supersampled(512, rounded=True, inset=0.20).save(OUT_DIR / "icon-512.png")
    # Maskable: full-bleed square, generous inset so the glyph survives masking.
    _supersampled(512, rounded=False, inset=0.27).save(OUT_DIR / "icon-maskable-512.png")
    # iOS apple-touch-icon: full-bleed square (iOS rounds it itself).
    _supersampled(180, rounded=False, inset=0.20).save(OUT_DIR / "apple-touch-icon.png")
    # Small favicon.
    _supersampled(32, rounded=True, inset=0.16).save(OUT_DIR / "favicon-32.png")
    print(f"[make_patient_pwa_icons] wrote 5 icons to {OUT_DIR}")


if __name__ == "__main__":
    main()
