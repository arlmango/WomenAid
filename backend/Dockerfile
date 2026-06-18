# WomenAId backend image.
# Build context is the REPO ROOT (so both backend/ and scripts/ are available):
#   docker build -f backend/Dockerfile -t womenaid-backend .
# (docker-compose does this automatically.)
FROM python:3.12-slim

# Runtime system deps:
#   libgomp1        — required by scikit-learn (OpenMP)
#   fonts-dejavu-core — Cyrillic-capable TTF for the PDF report
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for layer caching.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy the app and the demo scripts (mirrors the repo layout so seed_demo.py,
# which expects a sibling backend/ dir, resolves correctly).
COPY backend/ /app/backend/
COPY scripts/ /app/scripts/

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    WOMENAID_DATABASE_URL=sqlite:////data/womenaid.db \
    WOMENAID_MODEL_PATH=/data/checkpoint.joblib \
    WOMENAID_DATASET_PATH=/data/demo_dataset.npz \
    WOMENAID_UPLOAD_DIR=/data/uploads

WORKDIR /app/backend
RUN chmod +x /app/backend/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/app/backend/entrypoint.sh"]
