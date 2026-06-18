"""Generate a synthetic demo dataset of "classical image features".

⚠️  DEMO_SYNTHETIC_NOT_CLINICAL. The data is random with per-class offsets so the
demo RandomForest has something learnable. It carries NO clinical meaning and
must never be presented as real. Run:

    python -m app.ml.make_demo_data
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np

# Triage classes (CLAUDE.md) — the labels the demo model predicts.
TRIAGE_LABELS = [
    "INSUFFICIENT_QUALITY",
    "ROUTINE_FOLLOWUP",
    "PRIORITY_REVIEW",
    "URGENT_REVIEW",
]

# Stand-in "classical image features" (means/variances/texture proxies).
FEATURE_NAMES = [
    "mean_r", "mean_g", "mean_b", "std_r", "std_g", "std_b",
    "contrast", "homogeneity", "energy", "entropy",
    "edge_density", "blur_metric", "saturation", "hue_var",
    "lesion_area_ratio", "border_irregularity",
]


def dataset_path() -> Path:
    return Path(os.environ.get("WOMENAID_DATASET_PATH", "checkpoints/demo_dataset.npz"))


def generate(n_per_class: int = 300, seed: int = 42):
    rng = np.random.default_rng(seed)
    n_features = len(FEATURE_NAMES)
    xs, ys = [], []
    for class_index, label in enumerate(TRIAGE_LABELS):
        # Each class centered at a different offset so it is separable but noisy.
        center = rng.normal(loc=class_index * 0.8, scale=1.0, size=n_features)
        xs.append(rng.normal(loc=center, scale=1.5, size=(n_per_class, n_features)))
        ys.extend([label] * n_per_class)
    return np.vstack(xs), np.array(ys)


def main() -> None:
    X, y = generate()
    path = dataset_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez(path, X=X, y=y, feature_names=np.array(FEATURE_NAMES))
    print(f"[make_demo_data] wrote {X.shape[0]} synthetic samples "
          f"x {X.shape[1]} features -> {path}")
    print("[make_demo_data] dataset_status=DEMO_SYNTHETIC_NOT_CLINICAL")


if __name__ == "__main__":
    main()
