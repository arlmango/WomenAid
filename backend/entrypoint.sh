#!/bin/sh
# First-start bootstrap for the demo, then launch the API.
#   1. If no model checkpoint exists -> generate synthetic data + train demo model.
#   2. Seed demo app data (idempotent — skipped if already seeded).
#   3. Start uvicorn.
set -e

mkdir -p /data
MODEL_PATH="${WOMENAID_MODEL_PATH:-/data/checkpoint.joblib}"

if [ ! -f "$MODEL_PATH" ]; then
    echo "[entrypoint] No model checkpoint at $MODEL_PATH."
    echo "[entrypoint] Generating synthetic demo data + training demo model (first start, slower)..."
    python -m app.ml.make_demo_data
    python -m app.ml.train
else
    echo "[entrypoint] Found model checkpoint at $MODEL_PATH — skipping training."
fi

echo "[entrypoint] Seeding demo app data (idempotent)..."
python /app/scripts/seed_demo.py || echo "[entrypoint] demo data already present — skipping."

echo "[entrypoint] Starting uvicorn on 0.0.0.0:8000 ..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
