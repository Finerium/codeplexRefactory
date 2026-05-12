"""Token encryption at rest helper (Hades Wave 3).

OAuth access token encrypted via AES-256-GCM keyed by SESSION_SECRET-derived
key (HKDF-style: SHA-256(SESSION_SECRET || 'oauth-token-v1')).

[STUB-VERSUS-REAL]: Cycle 1 uses simple Fernet (symmetric key derived from
SESSION_SECRET hash). Demeter cycle 2 may upgrade to KMS or external key
management; for hackathon scope Fernet is sufficient because the at-rest
threat is read-only db dump (not key extraction from app memory).
"""
from __future__ import annotations

import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings

logger = logging.getLogger("hades.crypto")


def _derive_key() -> bytes:
    """Derive 32-byte key from SESSION_SECRET, base64-encoded for Fernet."""
    settings = get_settings()
    raw = settings.SESSION_SECRET.encode("utf-8") + b"|oauth-token-v1"
    digest = hashlib.sha256(raw).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_token(plaintext: str) -> str:
    """Encrypt OAuth access token. Returns urlsafe base64 cipher."""
    f = Fernet(_derive_key())
    cipher = f.encrypt(plaintext.encode("utf-8"))
    return cipher.decode("ascii")


def decrypt_token(cipher: str) -> str | None:
    """Decrypt OAuth access token. Returns None on failure."""
    f = Fernet(_derive_key())
    try:
        plain = f.decrypt(cipher.encode("ascii"))
        return plain.decode("utf-8")
    except InvalidToken:
        logger.warning("token decrypt failed: invalid token")
        return None
    except Exception as exc:
        logger.warning("token decrypt failed: %s", exc)
        return None
