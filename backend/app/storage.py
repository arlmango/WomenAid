"""Disk storage for uploaded images — always encrypted, UUID-named.

UUID filenames (not the original filename or any patient identifier) avoid
leaking PII through the filename itself and avoid path-traversal from a
client-supplied name.
"""
from __future__ import annotations

import uuid
from pathlib import Path

from app.config import UPLOAD_DIR
from app.encryption import encrypt_bytes


def save_encrypted_upload(patient_id: int, data: bytes) -> str:
    """Encrypt `data` and write it under UPLOAD_DIR/<patient_id>/<uuid>.enc.

    Returns the path as a string, suitable for RiskAssessment.image_path.
    """
    patient_dir = Path(UPLOAD_DIR) / str(patient_id)
    patient_dir.mkdir(parents=True, exist_ok=True)
    file_path = patient_dir / f"{uuid.uuid4().hex}.enc"
    file_path.write_bytes(encrypt_bytes(data))
    return str(file_path)


def delete_upload_file(path: str) -> None:
    """Best-effort delete; a missing file is not an error (already purged)."""
    try:
        Path(path).unlink()
    except FileNotFoundError:
        pass
