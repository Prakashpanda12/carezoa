from __future__ import annotations

import hashlib
import hmac
import secrets
import time
import uuid
from dataclasses import dataclass
from enum import StrEnum

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings


class Role(StrEnum):
    PATIENT = "patient"
    PROVIDER = "provider"
    FAMILY_MEMBER = "family_member"
    ADMIN = "admin"
    SUPPORT_AGENT = "support_agent"


password_ctx = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return password_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return password_ctx.verify(plain, hashed)


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    access_expires_at: int
    refresh_expires_at: int


def _encode(payload: dict, ttl_seconds: int) -> tuple[str, int]:
    settings = get_settings()
    exp = int(time.time()) + ttl_seconds
    body = {**payload, "exp": exp, "iat": int(time.time()), "jti": uuid.uuid4().hex}
    return jwt.encode(body, settings.jwt_secret, algorithm=settings.jwt_algorithm), exp


def issue_token_pair(user_id: int, role: Role, *, mfa: bool = False) -> TokenPair:
    settings = get_settings()
    access, aexp = _encode(
        {"sub": str(user_id), "role": role, "mfa": mfa}, settings.access_token_ttl_min * 60
    )
    refresh, rexp = _encode(
        {"sub": str(user_id), "type": "refresh"}, settings.refresh_token_ttl_days * 86_400
    )
    return TokenPair(access, refresh, aexp, rexp)


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def hash_otp(phone: str, code: str) -> str:
    settings = get_settings()
    return hmac.new(
        settings.otp_pepper.encode(), f"{phone}:{code}".encode(), hashlib.sha256
    ).hexdigest()


def new_otp_code() -> str:
    settings = get_settings()
    if not settings.is_prod:
        return settings.dev_otp_code
    return f"{secrets.randbelow(1_000_000):06d}"


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)
