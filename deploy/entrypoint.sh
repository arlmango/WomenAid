#!/usr/bin/env bash
# Combined-container entrypoint for a container host (Render/Railway/Fly):
#   1. Ensure the persistent data dir exists.
#   2. Seed demo data (idempotent — no-op if already seeded).
#   3. Optionally train the demo model (off by default; it is NOT wired to
#      serving, so we keep boot fast and reliable).
#   4. Start uvicorn on 127.0.0.1:8000 (internal only).
#   5. Render the nginx config with the platform $PORT and serve in foreground.
set -euo pipefail

PORT="${PORT:-8080}"
export PORT
DATA_DIR="/data"
MODEL_PATH="${WOMENAID_MODEL_PATH:-/data/checkpoint.joblib}"

mkdir -p "$DATA_DIR" "${WOMENAID_UPLOAD_DIR:-/data/uploads}"

echo "[entrypoint] seeding demo data (idempotent)..."
python /app/scripts/seed_demo.py || echo "[entrypoint] demo data already present — skipping."

if [ "${WOMENAID_TRAIN_ON_BOOT:-0}" = "1" ] && [ ! -f "$MODEL_PATH" ]; then
    echo "[entrypoint] training demo model (WOMENAID_TRAIN_ON_BOOT=1)..."
    python -m app.ml.make_demo_data && python -m app.ml.train \
        || echo "[entrypoint] training failed — continuing (model not wired to serving)."
fi

echo "[entrypoint] rendering nginx config for port ${PORT}..."
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

echo "[entrypoint] starting uvicorn on 127.0.0.1:8000 ..."
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
UVICORN_PID=$!

echo "[entrypoint] waiting for backend to accept connections..."
for _ in $(seq 1 30); do
    if python -c "import socket,sys; s=socket.socket(); s.settimeout(1); \
sys.exit(0 if s.connect_ex(('127.0.0.1',8000))==0 else 1)" 2>/dev/null; then
        echo "[entrypoint] backend is up."
        break
    fi
    sleep 1
done

echo "[entrypoint] starting nginx on :${PORT} ..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# If either process exits, bring the container down so the host restarts it.
wait -n "$UVICORN_PID" "$NGINX_PID"
echo "[entrypoint] a process exited — stopping container."
kill "$UVICORN_PID" "$NGINX_PID" 2>/dev/null || true
exit 1
