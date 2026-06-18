"""Encryption-at-rest for uploaded images.

Key comes from WOMENAID_FILE_ENCRYPTION_KEY (env var, never hardcoded). The
key is read lazily, at the point of use, not at import time — so the app can
still start (e.g. for routes unrelated to uploads) without it configured, but
any attempt to actually encrypt/decrypt a file fails loudly instead of
silently falling back to plaintext.
"""
from __future__ import annotations

from cryptography.fernet import Fernet, InvalidToken

from app.config import FILE_ENCRYPTION_KEY


class FileEncryptionNotConfigured(RuntimeError):
    pass


def _get_fernet() -> Fernet:
    if not FILE_ENCRYPTION_KEY:
        raise FileEncryptionNotConfigured(
            "WOMENAID_FILE_ENCRYPTION_KEY is not set — refusing to store an "
            "uploaded image without encryption at rest. Generate one with: "
            "python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )
    try:
        return Fernet(FILE_ENCRYPTION_KEY.encode("utf-8"))
    except ValueError as exc:
        raise FileEncryptionNotConfigured(
            "WOMENAID_FILE_ENCRYPTION_KEY is set but is not a valid Fernet key."
        ) from exc


def encrypt_bytes(data: bytes) -> bytes:
    return _get_fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    try:
        return _get_fernet().decrypt(data)
    except InvalidToken as exc:
        raise FileEncryptionNotConfigured(
            "Could not decrypt file with the configured "
            "WOMENAID_FILE_ENCRYPTION_KEY — wrong key, or file was encrypted "
            "with a different key."
        ) from exc
