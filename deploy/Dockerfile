# Combined single-container image: nginx (static frontend + reverse proxy) and
# uvicorn (FastAPI) in one container, for a container host that runs one
# container per service (Render / Railway / Fly.io). This is the deploy
# counterpart of the two-service local docker-compose.yml.
#
# Build context is the REPO ROOT:
#   docker build -f deploy/Dockerfile -t womenaid .
#   docker run -p 8080:8080 -v womenaid_data:/data \
#     -e WOMENAID_SECRET_KEY=... -e WOMENAID_FILE_ENCRYPTION_KEY=... womenaid

# Stage 1: build the Vite SPA (kept separate so the final image has no Node).
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim

# Runtime system deps:
#   nginx            — serves static frontend + reverse-proxies /api to uvicorn
#   gettext-base     — provides envsubst (renders nginx port at start)
#   libgomp1         — required by scikit-learn (OpenMP)
#   fonts-dejavu-core— Cyrillic-capable TTF for the PDF report
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        gettext-base \
        libgomp1 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

# Install Python deps first for layer caching.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# App, demo scripts, built frontend (from the build stage above), and the
# deploy glue.
COPY backend/ /app/backend/
COPY scripts/ /app/scripts/
COPY --from=frontend-build /app/frontend/dist /app/frontend
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/entrypoint.sh /app/deploy/entrypoint.sh
RUN chmod +x /app/deploy/entrypoint.sh

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    WOMENAID_DATABASE_URL=sqlite:////data/womenaid.db \
    WOMENAID_MODEL_PATH=/data/checkpoint.joblib \
    WOMENAID_DATASET_PATH=/data/demo_dataset.npz \
    WOMENAID_UPLOAD_DIR=/data/uploads \
    PORT=8080

WORKDIR /app/backend
EXPOSE 8080
ENTRYPOINT ["/app/deploy/entrypoint.sh"]
