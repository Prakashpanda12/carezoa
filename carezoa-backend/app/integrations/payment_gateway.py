"""Payment gateway adapter interface + sandbox implementation."""

from __future__ import annotations

import hashlib
import hmac
from typing import Protocol


class PaymentGateway(Protocol):
    name: str

    def checkout_url(self, *, checkout_ref: str) -> str: ...
    def verify_signature(self, payload_bytes: bytes, signature: str) -> bool: ...


class SandboxGateway:
    """Deterministic sandbox — webhook ref format is fixed so tests are stable."""

    name = "sandbox"

    def __init__(self, webhook_secret: str, app_base_url: str = "http://localhost:8000"):
        self._secret = webhook_secret
        self._base = app_base_url

    def checkout_url(self, *, checkout_ref: str) -> str:
        return f"{self._base}/sandbox/checkout/{checkout_ref}"

    def verify_signature(self, payload_bytes: bytes, signature: str) -> bool:
        digest = hmac.new(self._secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature)


def get_gateway(name: str, webhook_secret: str) -> PaymentGateway:
    if name != "sandbox":
        raise RuntimeError(f"Unsupported gateway: {name}")
    return SandboxGateway(webhook_secret)
