"""Train the demo RandomForest on the synthetic dataset and save a checkpoint.

⚠️  DEMO ONLY — the saved checkpoint is marked model_status=NOT_CLINICALLY_VALIDATED
and dataset_status=DEMO_SYNTHETIC_NOT_CLINICAL. The model is NOT wired into the
patient-facing serving path. Run (after make_demo_data):

    python -m app.ml.train
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from app.ml.make_demo_data import dataset_path

MODEL_VERSION = "demo-rf-0.0"
MODEL_STATUS = "NOT_CLINICALLY_VALIDATED"
DATASET_STATUS = "DEMO_SYNTHETIC_NOT_CLINICAL"


def model_path() -> Path:
    return Path(os.environ.get("WOMENAID_MODEL_PATH", "checkpoints/checkpoint.joblib"))


def main() -> None:
    ds = dataset_path()
    if not ds.exists():
        raise SystemExit(f"[train] dataset not found: {ds} — run make_demo_data first")

    data = np.load(ds, allow_pickle=True)
    X, y, feature_names = data["X"], data["y"], list(data["feature_names"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    pred = clf.predict(X_test)
    accuracy = float(accuracy_score(y_test, pred))
    f1_macro = float(f1_score(y_test, pred, average="macro"))

    out = model_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": clf,
            "feature_names": feature_names,
            "classes": list(clf.classes_),
            "model_version": MODEL_VERSION,
            "model_status": MODEL_STATUS,
            "dataset_status": DATASET_STATUS,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "metrics": {"accuracy": accuracy, "f1_macro": f1_macro},
            "n_train": int(len(y_train)),
            "n_test": int(len(y_test)),
        },
        out,
    )
    print(f"[train] accuracy={accuracy:.3f} f1_macro={f1_macro:.3f} "
          f"on {len(y_test)} held-out SYNTHETIC samples")
    print(f"[train] saved checkpoint -> {out} (model_status={MODEL_STATUS})")


if __name__ == "__main__":
    main()
