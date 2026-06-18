"""Application configuration.

All secrets/tunables are read from environment variables with dev-safe defaults.
Override WOMENAID_SECRET_KEY in any real deployment.
"""
from __future__ import annotations

import os

# --- JWT ---
SECRET_KEY = os.getenv("WOMENAID_SECRET_KEY", "dev-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("WOMENAID_TOKEN_EXPIRE_MINUTES", "60"))

# --- Database (SQLite by default, per CLAUDE.md) ---
DATABASE_URL = os.getenv("WOMENAID_DATABASE_URL", "sqlite:///./womenaid.db")

# --- Uploaded-image storage / encryption-at-rest ---
# Symmetric key (Fernet, urlsafe-base64) for encrypting uploaded images before
# they touch disk. Intentionally has NO default — see app/encryption.py: a
# missing key raises at point of use rather than silently storing plaintext.
FILE_ENCRYPTION_KEY = os.getenv("WOMENAID_FILE_ENCRYPTION_KEY")
UPLOAD_DIR = os.getenv("WOMENAID_UPLOAD_DIR", "data/uploads")

# --- Retention policy ---
# PLACEHOLDER, NOT A LEGAL DETERMINATION: default number of days an uploaded
# image is kept before the retention job purges it. ~3 years. The real number
# must come from the clinic's legal/compliance review, not from this code.
DEFAULT_RETENTION_DAYS = int(os.getenv("WOMENAID_DEFAULT_RETENTION_DAYS", "1095"))

# Whether erasure ("право на забвение") keeps a non-identifying statistical
# row per erased assessment for aggregate analytics. Off = full erasure, no trace.
KEEP_ANONYMIZED_STATS_ON_ERASURE = os.getenv(
    "WOMENAID_KEEP_ANONYMIZED_STATS", "true"
).lower() in ("1", "true", "yes")
